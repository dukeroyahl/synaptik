package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import org.dukeroyahl.synaptik.service.StanfordNLPService.NLPResult;
import org.dukeroyahl.synaptik.service.StanfordNLPService.EntityInfo;
import org.dukeroyahl.synaptik.service.StanfordNLPService.TimeInfo;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class NaturalLanguageParser {
    
    private static final Logger logger = Logger.getLogger(NaturalLanguageParser.class);
    
    @Inject
    StanfordNLPService nlpService;
    
    // Enhanced patterns for natural language parsing
    private static final Pattern PRIORITY_WORDS = Pattern.compile(
        "\\b(urgent|asap|high\\s+priority|important|critical|low\\s+priority|when\\s+possible)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ACTION_PATTERNS = Pattern.compile(
        "\\b(send|email|call|meet|review|fix|update|write|create|schedule|plan|organize|catch)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    public Task parseNaturalLanguage(String input) {
        logger.infof("Parsing input with Stanford NLP: %s", input);
        
        // Validate input
        if (input == null || input.trim().isEmpty()) {
            throw new IllegalArgumentException("Task input cannot be null or empty");
        }
        
        // Sanitize input - limit length to prevent memory issues
        String sanitizedInput = input.trim();
        if (sanitizedInput.length() > 10000) {
            logger.warnf("Input too long (%d chars), truncating to 10000 chars", sanitizedInput.length());
            sanitizedInput = sanitizedInput.substring(0, 10000);
        }
        
        // First try TaskWarrior syntax - if it contains structured syntax, use existing parser
        if (containsTaskWarriorSyntax(sanitizedInput)) {
            logger.info("Input contains TaskWarrior syntax, using structured parser");
            return TaskWarriorParser.parseTaskWarriorInput(sanitizedInput);
        }
        
        // Use Stanford NLP for natural language parsing
        return parseWithStanfordNLP(sanitizedInput);
    }
    
    private boolean containsTaskWarriorSyntax(String input) {
        return input.contains("priority:") || 
               input.contains("due:") || 
               input.contains("project:") || 
               input.contains("+") ||
               input.contains("assignee:");
    }
    
    private Task parseWithStanfordNLP(String input) {
        Task task = new Task();
        
        // Process with Stanford NLP
        NLPResult nlpResult = nlpService.processText(input);
        
        // Extract task components using NLP results
        task.title = extractTitle(input, nlpResult);
        task.assignee = extractAssignee(input, nlpResult);
        task.project = extractProject(input, nlpResult);
        task.dueDate = extractDueDate(input, nlpResult);
        task.priority = extractPriority(input, nlpResult);
        task.tags = extractTags(input, nlpResult);
        
        // Set default status
        task.status = TaskStatus.PENDING;
        
        logger.infof("Parsed Stanford NLP task: title='%s', assignee='%s', due='%s', priority='%s'", 
                    task.title, task.assignee, task.dueDate, task.priority);
        
        return task;
    }
    
    private String extractTitle(String input, NLPResult nlpResult) {
        String title = input;
        
        // Remove time expressions and entities for cleaner title
        for (TimeInfo timeInfo : nlpResult.timeExpressions) {
            title = title.replace(timeInfo.value, "").trim();
        }
        
        // Remove priority words
        Matcher priorityMatcher = PRIORITY_WORDS.matcher(title);
        title = priorityMatcher.replaceAll("").trim();
        
        // Clean up extra spaces
        title = title.replaceAll("\\s+", " ").trim();
        
        return title.isEmpty() ? "Untitled Task" : title;
    }
    
    private String extractAssignee(String input, NLPResult nlpResult) {
        // First try to find PERSON entities from Stanford NLP
        for (EntityInfo entity : nlpResult.entities) {
            if ("PERSON".equals(entity.type)) {
                return entity.value;
            }
        }
        
        // Fallback to pattern matching
        Pattern assigneePattern = Pattern.compile(
            "\\b(?:with|assign(?:ed)?\\s+to|for|call|meet(?:ing)?\\s+with)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)(?=\\s+(?:next|tomorrow|today|yesterday|at|on|in|a|the|over|about|for|\\d)|$)", 
            Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = assigneePattern.matcher(input);
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        return null;
    }
    
    private String extractProject(String input, NLPResult nlpResult) {
        // Look for project-related keywords
        Pattern projectPattern = Pattern.compile(
            "\\b(?:about|regarding|for|on)\\s+(?:the\\s+)?([\\w\\s]+?)(?:\\s+project|\\s+task|\\s+work|$)", 
            Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = projectPattern.matcher(input);
        if (matcher.find()) {
            String project = matcher.group(1).trim();
            if (project.length() > 3) { // Avoid single words like "it"
                return project;
            }
        }
        
        return null;
    }
    
    private LocalDateTime extractDueDate(String input, NLPResult nlpResult) {
        // Use Stanford NLP time expressions first
        for (TimeInfo timeInfo : nlpResult.timeExpressions) {
            LocalDateTime parsed = parseTimeExpression(timeInfo.value);
            if (parsed != null) {
                return parsed;
            }
        }
        
        // Fallback to manual pattern matching
        Pattern datePattern = Pattern.compile(
            "\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|in\\s+a\\s+week|a\\s+week\\s+from\\s+now|next\\s+week|\\d+\\s+weeks?\\s+from\\s+now|in\\s+\\d+\\s+weeks?|\\d+\\s+days?\\s+from\\s+now|in\\s+\\d+\\s+days?|\\d+/\\d+)\\b",
            Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = datePattern.matcher(input);
        if (matcher.find()) {
            return parseTimeExpression(matcher.group(1));
        }
        
        return null;
    }
    
    private TaskPriority extractPriority(String input, NLPResult nlpResult) {
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
    
    private List<String> extractTags(String input, NLPResult nlpResult) {
        List<String> tags = new ArrayList<>();
        
        // Add contextual tags based on actions and keywords
        Matcher actionMatcher = ACTION_PATTERNS.matcher(input);
        if (actionMatcher.find()) {
            String action = actionMatcher.group(1).toLowerCase();
            tags.add(action);
        }
        
        // Add specific tags based on content
        if (input.toLowerCase().contains("meet") || 
            input.toLowerCase().contains("call") || 
            input.toLowerCase().contains("catch up") ||
            input.toLowerCase().contains("dinner") ||
            input.toLowerCase().contains("lunch") ||
            input.toLowerCase().contains("coffee")) {
            tags.add("meeting");
        }
        if (input.toLowerCase().contains("email") || input.toLowerCase().contains("mail")) {
            tags.add("email");
        }
        if (input.toLowerCase().contains("review") || input.toLowerCase().contains("check")) {
            tags.add("review");
        }
        if (input.toLowerCase().contains("dinner") || 
            input.toLowerCase().contains("lunch") || 
            input.toLowerCase().contains("coffee") ||
            input.toLowerCase().contains("breakfast")) {
            tags.add("meal");
        }
        if (PRIORITY_WORDS.matcher(input).find()) {
            tags.add("priority");
        }
        
        // Add Stanford NLP detected entity types as tags
        for (EntityInfo entity : nlpResult.entities) {
            if ("ORGANIZATION".equals(entity.type) || "LOCATION".equals(entity.type)) {
                tags.add(entity.type.toLowerCase());
            }
        }
        
        return tags;
    }
    
    private LocalDateTime parseTimeExpression(String timeExpr) {
        LocalDateTime now = LocalDateTime.now();
        String expr = timeExpr.toLowerCase().trim();
        
        // Handle specific time expressions
        if (expr.contains("at") && (expr.contains("am") || expr.contains("pm"))) {
            return parseDateTime(expr);
        }
        
        return switch (expr) {
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
            case "next week" -> now.plusWeeks(1).withHour(23).withMinute(59);
            case "in a week", "a week from now" -> now.plusWeeks(1).withHour(23).withMinute(59);
            default -> {
                if (expr.startsWith("next ")) {
                    String day = expr.substring(5);
                    yield parseTimeExpression(day);
                }
                // Handle "X weeks from now" or "in X weeks"
                if (expr.matches("\\d+\\s+weeks?\\s+from\\s+now") || expr.matches("in\\s+\\d+\\s+weeks?")) {
                    Pattern weekPattern = Pattern.compile("(\\d+)\\s+weeks?");
                    Matcher weekMatcher = weekPattern.matcher(expr);
                    if (weekMatcher.find()) {
                        int weeks = Integer.parseInt(weekMatcher.group(1));
                        yield now.plusWeeks(weeks).withHour(23).withMinute(59);
                    }
                }
                // Handle "X days from now" or "in X days"
                if (expr.matches("\\d+\\s+days?\\s+from\\s+now") || expr.matches("in\\s+\\d+\\s+days?")) {
                    Pattern dayPattern = Pattern.compile("(\\d+)\\s+days?");
                    Matcher dayMatcher = dayPattern.matcher(expr);
                    if (dayMatcher.find()) {
                        int days = Integer.parseInt(dayMatcher.group(1));
                        yield now.plusDays(days).withHour(23).withMinute(59);
                    }
                }
                yield null;
            }
        };
    }
    
    private LocalDateTime parseDateTime(String timeInfo) {
        LocalDateTime baseDate = null;
        
        // Extract date part
        Pattern datePattern = Pattern.compile("\\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b", Pattern.CASE_INSENSITIVE);
        Matcher dateMatcher = datePattern.matcher(timeInfo);
        if (dateMatcher.find()) {
            baseDate = parseTimeExpression(dateMatcher.group(1));
        } else {
            baseDate = LocalDateTime.now(); // Default to today
        }
        
        // Extract time part
        Pattern timePattern = Pattern.compile("\\b(\\d{1,2})(?::(\\d{2}))?(am|pm|AM|PM)\\b");
        Matcher timeMatcher = timePattern.matcher(timeInfo);
        if (timeMatcher.find() && baseDate != null) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
            String ampm = timeMatcher.group(3);
            
            if (ampm != null && ampm.toLowerCase().equals("pm") && hour != 12) {
                hour += 12;
            } else if (ampm != null && ampm.toLowerCase().equals("am") && hour == 12) {
                hour = 0;
            }
            
            return baseDate.withHour(hour).withMinute(minute).withSecond(0);
        }
        
        return baseDate;
    }
    
    private LocalDateTime getNextDayOfWeek(LocalDateTime now, int targetDayOfWeek) {
        int currentDayOfWeek = now.getDayOfWeek().getValue();
        int daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        if (daysToAdd == 0) daysToAdd = 7; // Next week if it's the same day
        return now.plusDays(daysToAdd).withHour(23).withMinute(59);
    }
}
