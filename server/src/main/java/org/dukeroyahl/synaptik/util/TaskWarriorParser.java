package org.dukeroyahl.synaptik.util;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.jboss.logging.Logger;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TaskWarriorParser {
    
    private static final Logger logger = Logger.getLogger(TaskWarriorParser.class);
    
    private static final Pattern PRIORITY_PATTERN = Pattern.compile("\\bpriority:([HML])\\b");
    private static final Pattern PROJECT_PATTERN = Pattern.compile("\\bproject:([\\w\\-_]+)\\b");
    private static final Pattern DUE_PATTERN = Pattern.compile("\\bdue:([\\w\\-:]+)\\b");
    private static final Pattern WAIT_PATTERN = Pattern.compile("\\bwait:([\\w\\-:]+)\\b");
    private static final Pattern TAG_PATTERN = Pattern.compile("\\+([\\w\\-_]+)\\b");
    private static final Pattern ANNOTATION_PATTERN = Pattern.compile("\\bannotation:\"([^\"]+)\"\\b");
    
    public static Task parseTaskWarriorInput(String input) {
        return parseTaskWarriorInput(input, DateTimeUtils.DEFAULT_TIMEZONE);
    }
    
    public static Task parseTaskWarriorInput(String input, String userTimezone) {
        logger.infof("Parsing TaskWarrior input: %s", input);
        
        Task task = new Task();
        String workingInput = input.trim();
        
        // Extract priority
        Matcher priorityMatcher = PRIORITY_PATTERN.matcher(workingInput);
        if (priorityMatcher.find()) {
            String priorityStr = priorityMatcher.group(1);
            task.priority = switch (priorityStr) {
                case "H" -> TaskPriority.HIGH;
                case "M" -> TaskPriority.MEDIUM;
                case "L" -> TaskPriority.LOW;
                default -> TaskPriority.NONE;
            };
            workingInput = priorityMatcher.replaceAll("").trim();
        }
        
        // Extract project
        Matcher projectMatcher = PROJECT_PATTERN.matcher(workingInput);
        if (projectMatcher.find()) {
            task.project = projectMatcher.group(1);
            workingInput = projectMatcher.replaceAll("").trim();
        }
        
        // Extract due date
        Matcher dueMatcher = DUE_PATTERN.matcher(workingInput);
        if (dueMatcher.find()) {
            String dueDateStr = dueMatcher.group(1);
            ZonedDateTime dueDateTime = parseDateString(dueDateStr, userTimezone);
            if (dueDateTime != null) {
                task.dueDate = dueDateTime.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
            workingInput = dueMatcher.replaceAll("").trim();
        }
        
        // Extract wait until date
        Matcher waitMatcher = WAIT_PATTERN.matcher(workingInput);
        if (waitMatcher.find()) {
            String waitDateStr = waitMatcher.group(1);
            ZonedDateTime waitDateTime = parseDateString(waitDateStr, userTimezone);
            if (waitDateTime != null) {
                task.waitUntil = waitDateTime.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
            workingInput = waitMatcher.replaceAll("").trim();
        }
        
        // Extract tags
        Matcher tagMatcher = TAG_PATTERN.matcher(workingInput);
        List<String> tags = new ArrayList<>();
        while (tagMatcher.find()) {
            tags.add(tagMatcher.group(1));
        }
        if (!tags.isEmpty()) {
            task.tags = tags;
        }
        workingInput = tagMatcher.replaceAll("").trim();
        
        // Extract annotations
        Matcher annotationMatcher = ANNOTATION_PATTERN.matcher(workingInput);
        while (annotationMatcher.find()) {
            task.addAnnotation(annotationMatcher.group(1));
        }
        workingInput = annotationMatcher.replaceAll("").trim();
        
        // Remaining text is the title
        task.title = workingInput.isEmpty() ? "Untitled Task" : workingInput;
        
        // Set default status
        task.status = TaskStatus.PENDING;
        
        // Set wait status if waitUntil is in the future
        if (task.waitUntil != null && !task.waitUntil.trim().isEmpty()) {
            try {
                ZonedDateTime waitDateTime = ZonedDateTime.parse(task.waitUntil);
                if (waitDateTime.isAfter(DateTimeUtils.nowInUserTimezone(userTimezone))) {
                    task.status = TaskStatus.WAITING;
                }
            } catch (Exception e) {
                // Invalid date format, ignore
            }
        }
        
        logger.infof("Parsed task: title='%s', priority=%s, project='%s', dueDate=%s, tags=%s", 
                    task.title, task.priority, task.project, task.dueDate, task.tags);
        
        return task;
    }
    
    private static ZonedDateTime parseDateString(String dateStr, String userTimezone) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        String lowerDateStr = dateStr.toLowerCase().trim();
        
        return switch (lowerDateStr) {
            case "today" -> DateTimeUtils.todayEndInUserTimezone(userTimezone);
            case "tomorrow" -> DateTimeUtils.tomorrowInUserTimezone(userTimezone);
            case "yesterday" -> DateTimeUtils.yesterdayInUserTimezone(userTimezone);
            default -> {
                // Try to parse as absolute date
                try {
                    // Try different formats
                    DateTimeFormatter[] formatters = {
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                        DateTimeFormatter.ISO_LOCAL_DATE,
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    };
                    
                    for (DateTimeFormatter formatter : formatters) {
                        try {
                            if (formatter == DateTimeFormatter.ISO_LOCAL_DATE || 
                                formatter == DateTimeFormatter.ofPattern("yyyy-MM-dd")) {
                                yield DateTimeUtils.parseWithTimezone(dateStr + "T23:59:59", userTimezone);
                            } else {
                                yield DateTimeUtils.parseWithTimezone(dateStr, userTimezone);
                            }
                        } catch (DateTimeParseException e) {
                            // Try next formatter
                        }
                    }
                    
                    // If we get here, parsing failed
                    logger.warnf("Unable to parse date string: %s", dateStr);
                    yield null;
                } catch (Exception e) {
                    logger.warnf("Error parsing date string '%s': %s", dateStr, e.getMessage());
                    yield null;
                }
            }
        };
    }
    
    public static String formatTaskForExport(Task task) {
        StringBuilder sb = new StringBuilder();
        
        sb.append(task.title);
        
        if (task.priority != TaskPriority.NONE) {
            sb.append(" priority:").append(task.priority.getValue());
        }
        
        if (task.project != null && !task.project.isEmpty()) {
            sb.append(" project:").append(task.project);
        }
        
        if (task.dueDate != null && !task.dueDate.trim().isEmpty()) {
            try {
                ZonedDateTime dueDateTime = ZonedDateTime.parse(task.dueDate);
                sb.append(" due:").append(dueDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE));
            } catch (Exception e) {
                // Invalid date format, skip
            }
        }
        
        if (task.waitUntil != null && !task.waitUntil.trim().isEmpty()) {
            try {
                ZonedDateTime waitDateTime = ZonedDateTime.parse(task.waitUntil);
                sb.append(" wait:").append(waitDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE));
            } catch (Exception e) {
                // Invalid date format, skip
            }
        }
        
        if (task.tags != null && !task.tags.isEmpty()) {
            for (String tag : task.tags) {
                sb.append(" +").append(tag);
            }
        }
        
        return sb.toString();
    }
}