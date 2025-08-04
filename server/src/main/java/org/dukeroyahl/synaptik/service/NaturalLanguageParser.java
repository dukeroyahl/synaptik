package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import org.dukeroyahl.synaptik.service.StanfordNLPService.NLPResult;
import org.dukeroyahl.synaptik.service.StanfordNLPService.EntityInfo;
import org.dukeroyahl.synaptik.service.StanfordNLPService.TimeInfo;
import org.dukeroyahl.synaptik.util.DateTimeUtils;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.ZonedDateTime;
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
        return parseNaturalLanguage(input, null);
    }
    
    public Task parseNaturalLanguage(String input, String userTimezone) {
        logger.infof("Parsing input with Stanford NLP: %s (timezone: %s)", input, userTimezone);
        
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
            return TaskWarriorParser.parseTaskWarriorInput(sanitizedInput, userTimezone);
        }
        
        // Use Stanford NLP for natural language parsing
        return parseWithStanfordNLP(sanitizedInput, userTimezone);
    }
    
    private boolean containsTaskWarriorSyntax(String input) {
        return input.contains("priority:") || 
               input.contains("due:") || 
               input.contains("project:") || 
               input.contains("+") ||
               input.contains("assignee:");
    }
    
    private Task parseWithStanfordNLP(String input, String userTimezone) {
        Task task = new Task();
        
        // Process with Stanford NLP
        NLPResult nlpResult = nlpService.processText(input);
        
        // Extract task components using NLP results
        task.title = extractTitle(input, nlpResult);
        task.assignee = extractAssignee(input, nlpResult);
        task.project = extractProject(input, nlpResult);
        task.dueDate = extractDueDate(input, nlpResult, userTimezone);
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
    
    private String extractDueDate(String input, NLPResult nlpResult, String userTimezone) {
        // Use Stanford NLP time expressions first
        for (TimeInfo timeInfo : nlpResult.timeExpressions) {
            ZonedDateTime parsed = parseTimeExpression(timeInfo.value, userTimezone);
            if (parsed != null) {
                return parsed.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
        }
        
        // Fallback to manual pattern matching
        Pattern datePattern = Pattern.compile(
            "\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|in\\s+a\\s+week|a\\s+week\\s+from\\s+now|next\\s+week|\\d+\\s+weeks?\\s+from\\s+now|in\\s+\\d+\\s+weeks?|\\d+\\s+days?\\s+from\\s+now|in\\s+\\d+\\s+days?|\\d+/\\d+)\\b",
            Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = datePattern.matcher(input);
        if (matcher.find()) {
            ZonedDateTime parsed = parseTimeExpression(matcher.group(1), userTimezone);
            if (parsed != null) {
                return parsed.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
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
    
    private ZonedDateTime parseTimeExpression(String timeExpr, String userTimezone) {
        String expr = timeExpr.toLowerCase().trim();
        
        // Handle specific time expressions with times (like "tomorrow at 3pm")
        if (expr.contains("at") && (expr.contains("am") || expr.contains("pm"))) {
            // For now, just parse the date part and ignore the time
            // TODO: Implement proper time parsing
            String datePart = expr.split("\\s+at\\s+")[0];
            // Avoid recursion by directly handling the date part
            return parseDatePartDirectly(datePart, userTimezone);
        }
        
        return switch (expr) {
            case "today" -> DateTimeUtils.todayEndInUserTimezone(userTimezone);
            case "tomorrow" -> DateTimeUtils.tomorrowInUserTimezone(userTimezone);
            case "yesterday" -> DateTimeUtils.yesterdayInUserTimezone(userTimezone);
            case "monday" -> DateTimeUtils.nextWeekdayInUserTimezone(1, userTimezone);
            case "tuesday" -> DateTimeUtils.nextWeekdayInUserTimezone(2, userTimezone);
            case "wednesday" -> DateTimeUtils.nextWeekdayInUserTimezone(3, userTimezone);
            case "thursday" -> DateTimeUtils.nextWeekdayInUserTimezone(4, userTimezone);
            case "friday" -> DateTimeUtils.nextWeekdayInUserTimezone(5, userTimezone);
            case "saturday" -> DateTimeUtils.nextWeekdayInUserTimezone(6, userTimezone);
            case "sunday" -> DateTimeUtils.nextWeekdayInUserTimezone(7, userTimezone);
            case "next week" -> DateTimeUtils.addWeeksInUserTimezone(1, userTimezone);
            case "in a week", "a week from now" -> DateTimeUtils.addWeeksInUserTimezone(1, userTimezone);
            default -> {
                // Handle "next monday", "next tuesday", etc.
                if (expr.startsWith("next ")) {
                    String day = expr.substring(5);
                    yield parseDatePartDirectly(day, userTimezone);
                }
                // Handle "X weeks from now" or "in X weeks"
                if (expr.matches("\\d+\\s+weeks?\\s+from\\s+now") || expr.matches("in\\s+\\d+\\s+weeks?")) {
                    Pattern weekPattern = Pattern.compile("(\\d+)\\s+weeks?");
                    Matcher weekMatcher = weekPattern.matcher(expr);
                    if (weekMatcher.find()) {
                        int weeks = Integer.parseInt(weekMatcher.group(1));
                        yield DateTimeUtils.addWeeksInUserTimezone(weeks, userTimezone);
                    }
                }
                // Handle "X days from now" or "in X days"
                if (expr.matches("\\d+\\s+days?\\s+from\\s+now") || expr.matches("in\\s+\\d+\\s+days?")) {
                    Pattern dayPattern = Pattern.compile("(\\d+)\\s+days?");
                    Matcher dayMatcher = dayPattern.matcher(expr);
                    if (dayMatcher.find()) {
                        int days = Integer.parseInt(dayMatcher.group(1));
                        yield DateTimeUtils.addDaysInUserTimezone(days, userTimezone);
                    }
                }
                yield null;
            }
        };
    }
    
    /**
     * Parse date part directly without recursion
     */
    private ZonedDateTime parseDatePartDirectly(String datePart, String userTimezone) {
        return switch (datePart.toLowerCase().trim()) {
            case "today" -> DateTimeUtils.todayEndInUserTimezone(userTimezone);
            case "tomorrow" -> DateTimeUtils.tomorrowInUserTimezone(userTimezone);
            case "yesterday" -> DateTimeUtils.yesterdayInUserTimezone(userTimezone);
            case "monday" -> DateTimeUtils.nextWeekdayInUserTimezone(1, userTimezone);
            case "tuesday" -> DateTimeUtils.nextWeekdayInUserTimezone(2, userTimezone);
            case "wednesday" -> DateTimeUtils.nextWeekdayInUserTimezone(3, userTimezone);
            case "thursday" -> DateTimeUtils.nextWeekdayInUserTimezone(4, userTimezone);
            case "friday" -> DateTimeUtils.nextWeekdayInUserTimezone(5, userTimezone);
            case "saturday" -> DateTimeUtils.nextWeekdayInUserTimezone(6, userTimezone);
            case "sunday" -> DateTimeUtils.nextWeekdayInUserTimezone(7, userTimezone);
            default -> null;
        };
    }
}
