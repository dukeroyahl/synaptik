package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class NaturalLanguageParser {
    
    private static final Logger logger = Logger.getLogger(NaturalLanguageParser.class);
    
    // Patterns for natural language parsing
    private static final Pattern MEETING_PATTERN = Pattern.compile(
        "(?:meet|meeting|call|talk)\\s+(?:with\\s+)?([\\w\\s]+?)\\s+(?:on\\s+|at\\s+)?([\\w\\s,]+?)\\s+(?:about\\s+|for\\s+|regarding\\s+)([\\w\\s]+)",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern TIME_PATTERN = Pattern.compile(
        "(\\d{1,2})(?::(\\d{2}))?(am|pm)?", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|\\d+/\\d+)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern PRIORITY_WORDS = Pattern.compile(
        "\\b(urgent|asap|high\\s+priority|important|critical|low\\s+priority|when\\s+possible)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    public Task parseNaturalLanguage(String input) {
        logger.infof("Parsing natural language input: %s", input);
        
        // First try TaskWarrior syntax - if it contains structured syntax, use existing parser
        if (containsTaskWarriorSyntax(input)) {
            logger.info("Input contains TaskWarrior syntax, using structured parser");
            return TaskWarriorParser.parseTaskWarriorInput(input);
        }
        
        // Otherwise, attempt natural language parsing
        return parseAsNaturalLanguage(input);
    }
    
    private boolean containsTaskWarriorSyntax(String input) {
        return input.contains("priority:") || 
               input.contains("due:") || 
               input.contains("project:") || 
               input.contains("+") ||
               input.contains("assignee:");
    }
    
    private Task parseAsNaturalLanguage(String input) {
        Task task = new Task();
        
        // Try to parse as a meeting
        Matcher meetingMatcher = MEETING_PATTERN.matcher(input);
        if (meetingMatcher.find()) {
            String person = meetingMatcher.group(1).trim();
            String timeInfo = meetingMatcher.group(2).trim();
            String topic = meetingMatcher.group(3).trim();
            
            task.title = String.format("Meet with %s about %s", person, topic);
            task.assignee = person;
            task.project = extractProject(topic);
            task.dueDate = parseDateTime(timeInfo);
            
            // Add meeting tag
            task.tags = new ArrayList<>();
            task.tags.add("meeting");
            
            logger.infof("Parsed as meeting: %s with %s about %s", task.title, person, topic);
        } else {
            // General task parsing
            task.title = extractTitle(input);
            task.dueDate = extractDueDate(input);
            task.priority = extractPriority(input);
            task.assignee = extractAssignee(input);
            task.project = extractProject(input);
            task.tags = extractTags(input);
        }
        
        // Set default status
        task.status = TaskStatus.PENDING;
        
        logger.infof("Parsed natural language task: title='%s', assignee='%s', due='%s'", 
                    task.title, task.assignee, task.dueDate);
        
        return task;
    }
    
    private String extractTitle(String input) {
        // Remove time/date information and priority words for cleaner title
        String title = input;
        title = DATE_PATTERN.matcher(title).replaceAll("");
        title = TIME_PATTERN.matcher(title).replaceAll("");
        title = PRIORITY_WORDS.matcher(title).replaceAll("");
        
        return title.trim().isEmpty() ? "Untitled Task" : title.trim();
    }
    
    private LocalDateTime extractDueDate(String input) {
        Matcher dateMatcher = DATE_PATTERN.matcher(input);
        if (dateMatcher.find()) {
            String dateStr = dateMatcher.group(1).toLowerCase();
            return parseDateString(dateStr);
        }
        return null;
    }
    
    private LocalDateTime parseDateTime(String timeInfo) {
        LocalDateTime baseDate = null;
        
        // Extract date
        Matcher dateMatcher = DATE_PATTERN.matcher(timeInfo);
        if (dateMatcher.find()) {
            String dateStr = dateMatcher.group(1).toLowerCase();
            baseDate = parseDateString(dateStr);
        }
        
        // Extract time
        Matcher timeMatcher = TIME_PATTERN.matcher(timeInfo);
        if (timeMatcher.find() && baseDate != null) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
            String ampm = timeMatcher.group(3);
            
            if (ampm != null && ampm.equalsIgnoreCase("pm") && hour != 12) {
                hour += 12;
            } else if (ampm != null && ampm.equalsIgnoreCase("am") && hour == 12) {
                hour = 0;
            }
            
            return baseDate.withHour(hour).withMinute(minute);
        }
        
        return baseDate;
    }
    
    private LocalDateTime parseDateString(String dateStr) {
        LocalDateTime now = LocalDateTime.now();
        
        return switch (dateStr.toLowerCase()) {
            case "today" -> now.withHour(23).withMinute(59);
            case "tomorrow" -> now.plusDays(1).withHour(23).withMinute(59);
            case "yesterday" -> now.minusDays(1).withHour(23).withMinute(59);
            case "monday" -> getNextDayOfWeek(now, 1);
            case "tuesday" -> getNextDayOfWeek(now, 2);
            case "wednesday" -> getNextDayOfWeek(now, 3);
            case "thursday" -> getNextDayOfWeek(now, 4);
            case "friday" -> getNextDayOfWeek(now, 5);
            case "saturday" -> getNextDayOfWeek(now, 6);
            case "sunday" -> getNextDayOfWeek(now, 7);
            default -> {
                try {
                    // Try parsing as MM/dd format
                    if (dateStr.contains("/")) {
                        String[] parts = dateStr.split("/");
                        int month = Integer.parseInt(parts[0]);
                        int day = Integer.parseInt(parts[1]);
                        yield now.withMonth(month).withDayOfMonth(day).withHour(23).withMinute(59);
                    }
                } catch (Exception e) {
                    logger.warnf("Could not parse date: %s", dateStr);
                }
                yield null;
            }
        };
    }
    
    private LocalDateTime getNextDayOfWeek(LocalDateTime now, int targetDayOfWeek) {
        int currentDayOfWeek = now.getDayOfWeek().getValue();
        int daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        if (daysToAdd == 0) daysToAdd = 7; // Next week if it's the same day
        return now.plusDays(daysToAdd).withHour(23).withMinute(59);
    }
    
    private TaskPriority extractPriority(String input) {
        Matcher priorityMatcher = PRIORITY_WORDS.matcher(input);
        if (priorityMatcher.find()) {
            String priorityWord = priorityMatcher.group(1).toLowerCase();
            return switch (priorityWord) {
                case "urgent", "asap", "high priority", "important", "critical" -> TaskPriority.HIGH;
                case "low priority", "when possible" -> TaskPriority.LOW;
                default -> TaskPriority.MEDIUM;
            };
        }
        return TaskPriority.NONE;
    }
    
    private String extractAssignee(String input) {
        // Look for "with [person]" patterns
        Pattern assigneePattern = Pattern.compile("\\b(?:with|assign(?:ed)?\\s+to|for)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = assigneePattern.matcher(input);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
    
    private String extractProject(String input) {
        // Look for project-related keywords
        Pattern projectPattern = Pattern.compile("\\b(?:about|regarding|for|on)\\s+(?:the\\s+)?([\\w\\s]+?)(?:\\s+project|\\s+task|$)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = projectPattern.matcher(input);
        if (matcher.find()) {
            String project = matcher.group(1).trim();
            if (project.length() > 3) { // Avoid single words like "it"
                return project;
            }
        }
        return null;
    }
    
    private List<String> extractTags(String input) {
        List<String> tags = new ArrayList<>();
        
        // Add contextual tags based on keywords
        if (input.toLowerCase().contains("meet") || input.toLowerCase().contains("call")) {
            tags.add("meeting");
        }
        if (input.toLowerCase().contains("review") || input.toLowerCase().contains("check")) {
            tags.add("review");
        }
        if (input.toLowerCase().contains("email") || input.toLowerCase().contains("mail")) {
            tags.add("email");
        }
        if (input.toLowerCase().contains("urgent") || input.toLowerCase().contains("asap")) {
            tags.add("urgent");
        }
        
        return tags;
    }
}
