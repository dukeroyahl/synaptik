package org.dukeroyahl.synaptik.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;

/**
 * Simplified TaskWarrior parser for MCP server
 */
public class TaskWarriorParser {
    
    private static final Pattern PRIORITY_PATTERN = Pattern.compile("priority:([HML])");
    private static final Pattern DUE_PATTERN = Pattern.compile("due:(\\S+)");
    private static final Pattern PROJECT_PATTERN = Pattern.compile("project:(\\S+)");
    private static final Pattern TAG_PATTERN = Pattern.compile("\\+(\\w+)");
    
    public static Task parseTaskWarriorInput(String input) {
        Task task = new Task();
        
        // Extract title (everything that's not a modifier)
        String title = input.replaceAll("priority:\\S+|due:\\S+|project:\\S+|\\+\\w+", "").trim();
        task.title = title;
        
        // Extract priority
        Matcher priorityMatcher = PRIORITY_PATTERN.matcher(input);
        if (priorityMatcher.find()) {
            String priority = priorityMatcher.group(1);
            switch (priority) {
                case "H": task.priority = TaskPriority.HIGH; break;
                case "M": task.priority = TaskPriority.MEDIUM; break;
                case "L": task.priority = TaskPriority.LOW; break;
            }
        }
        
        // Extract due date
        Matcher dueMatcher = DUE_PATTERN.matcher(input);
        if (dueMatcher.find()) {
            String dueStr = dueMatcher.group(1);
            try {
                if ("today".equals(dueStr)) {
                    task.dueDate = LocalDateTime.now().withHour(23).withMinute(59);
                } else if ("tomorrow".equals(dueStr)) {
                    task.dueDate = LocalDateTime.now().plusDays(1).withHour(23).withMinute(59);
                } else {
                    task.dueDate = LocalDateTime.parse(dueStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
        }
        
        // Extract project
        Matcher projectMatcher = PROJECT_PATTERN.matcher(input);
        if (projectMatcher.find()) {
            task.project = projectMatcher.group(1);
        }
        
        // Extract tags
        Matcher tagMatcher = TAG_PATTERN.matcher(input);
        List<String> tags = new ArrayList<>();
        while (tagMatcher.find()) {
            tags.add(tagMatcher.group(1));
        }
        task.tags = tags;
        
        task.status = TaskStatus.PENDING;
        return task;
    }
}