package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import org.dukeroyahl.synaptik.service.OpenNLPService.NLPResult;
import org.dukeroyahl.synaptik.service.OpenNLPService.EntityInfo;
import org.dukeroyahl.synaptik.service.OpenNLPService.TimeInfo;
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
    OpenNLPService nlpService;
    
    // Enhanced patterns for natural language parsing
    private static final Pattern PRIORITY_WORDS = Pattern.compile(
        "\\b(urgent|asap|high\\s+priority|important|critical|low\\s+priority|when\\s+possible|must|should|need\\s+to|have\\s+to|deadline|due\\s+now)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ACTION_PATTERNS = Pattern.compile(
        "\\b(send|email|call|meet|review|fix|update|write|create|schedule|plan|organize|catch|discuss|present|submit|deliver|prepare|analyze|report)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern COMPOUND_SEPARATOR = Pattern.compile(
        "\\b(about|regarding|for|concerning|re:|on\\s+the\\s+topic\\s+of)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern TIME_SPECIFIC_PATTERNS = Pattern.compile(
        "\\b(at\\s+\\d{1,2}(?::\\d{2})?(?:am|pm)|by\\s+\\d{1,2}(?::\\d{2})?(?:am|pm)|before\\s+\\d{1,2}(?::\\d{2})?(?:am|pm))\\b",
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
        
        // Use OpenNLP for natural language parsing
        return parseWithOpenNLP(sanitizedInput, userTimezone);
    }
    
    private boolean containsTaskWarriorSyntax(String input) {
        return input.contains("priority:") || 
               input.contains("due:") || 
               input.contains("project:") || 
               input.contains("+") ||
               input.contains("assignee:");
    }
    
    private Task parseWithOpenNLP(String input, String userTimezone) {
        Task task = new Task();
        
        // Store the original user input
        task.originalInput = input;
        
        // Check for compound sentences and parse accordingly
        CompoundTaskInfo compoundInfo = parseCompoundSentence(input);
        String mainTaskText = compoundInfo.mainTask;
        
        // Process with OpenNLP
        NLPResult nlpResult = nlpService.processText(mainTaskText);
        
        // Extract task components using enhanced NLP results
        task.title = extractTitle(mainTaskText, nlpResult);
        task.assignee = extractAssignee(mainTaskText, nlpResult);
        task.project = extractProject(mainTaskText, nlpResult, compoundInfo);
        task.dueDate = extractDueDate(mainTaskText, nlpResult, userTimezone);
        task.priority = extractPriorityWithContext(mainTaskText, nlpResult, compoundInfo);
        task.tags = extractTags(mainTaskText, nlpResult);
        task.description = compoundInfo.context; // Use compound context as description
        
        // Extract location if present
        String location = extractLocation(mainTaskText, nlpResult);
        if (location != null && !location.isEmpty()) {
            task.tags.add("location:" + location);
        }
        
        // Extract task relationships and add as semantic tags
        List<String> relationships = extractTaskRelationships(mainTaskText, nlpResult, compoundInfo);
        if (!relationships.isEmpty()) {
            task.tags.addAll(relationships);
        }
        
        // Set default status
        task.status = TaskStatus.PENDING;
        
        logger.infof("Parsed enhanced OpenNLP task: title='%s', assignee='%s', due='%s', priority='%s', context='%s'", 
                    task.title, task.assignee, task.dueDate, task.priority, task.description);
        
        return task;
    }
    
    private CompoundTaskInfo parseCompoundSentence(String input) {
        CompoundTaskInfo info = new CompoundTaskInfo();
        info.originalInput = input;
        
        // Look for compound sentence patterns
        Matcher compoundMatcher = COMPOUND_SEPARATOR.matcher(input);
        if (compoundMatcher.find()) {
            // Split the sentence
            String beforeContext = input.substring(0, compoundMatcher.start()).trim();
            String contextKeyword = compoundMatcher.group(1);
            String afterContext = input.substring(compoundMatcher.end()).trim();
            
            // Determine which part is the main task and which is context
            if (ACTION_PATTERNS.matcher(beforeContext).find()) {
                info.mainTask = beforeContext;
                info.context = afterContext;
                info.contextType = contextKeyword;
            } else {
                info.mainTask = input; // Keep the whole sentence as main task
                info.context = afterContext;
                info.contextType = contextKeyword;
            }
        } else {
            info.mainTask = input;
        }
        
        return info;
    }
    
    private static class CompoundTaskInfo {
        String originalInput;
        String mainTask;
        String context;
        String contextType;
    }
    
    private String extractTitle(String input, NLPResult nlpResult) {
        String title = input;
        
        // Only remove time expressions that are at the end of the sentence or standalone
        // This preserves context like "meeting in 2 weeks" while removing "... tomorrow"
        for (TimeInfo timeInfo : nlpResult.timeExpressions) {
            String timeValue = timeInfo.value;
            
            // Only remove if the time expression is:
            // 1. At the end of the input (possibly with trailing spaces/punctuation)
            // 2. Standalone absolute dates like "2024-08-19" or "tomorrow" 
            if (title.trim().endsWith(timeValue) || 
                timeValue.matches("\\d{4}-\\d{2}-\\d{2}|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday")) {
                title = title.replace(timeValue, "").trim();
            }
        }
        
        // Remove priority words
        Matcher priorityMatcher = PRIORITY_WORDS.matcher(title);
        title = priorityMatcher.replaceAll("").trim();
        
        // Clean up extra spaces and trailing prepositions
        title = title.replaceAll("\\s+", " ").trim();
        title = title.replaceAll("\\s+(in|on|at|by)\\s*$", "").trim();
        
        return title.isEmpty() ? "Untitled Task" : title;
    }
    
    private String extractAssignee(String input, NLPResult nlpResult) {
        // Trust OpenNLP PERSON entities first - they're usually more accurate than regex
        for (EntityInfo entity : nlpResult.entities) {
            if ("PERSON".equals(entity.type)) {
                String personName = entity.value;
                // Clean up common noise that OpenNLP might include
                personName = cleanPersonName(personName);
                if (isValidPersonName(personName)) {
                    return personName;
                }
            }
        }
        
        // Only use regex as a last resort for cases where OpenNLP fails completely
        return extractAssigneeRegexFallback(input);
    }
    
    /**
     * Clean person names extracted by OpenNLP
     */
    private String cleanPersonName(String personName) {
        if (personName == null) return null;
        
        // Remove common time and location words that might get attached
        personName = personName.replaceAll("\\s+(?:tomorrow|today|yesterday|tonight|morning|afternoon|evening|next|last|week|month|year|at|in|on|the|office|home|\\d+)\\b", "").trim();
        
        // Remove prepositions that might be attached (this fixes "with team" -> "team")
        personName = personName.replaceAll("^(?:with|at|in|on|by|for)\\s+", "").trim();
        personName = personName.replaceAll("\\s+(?:at|in|on|by|with|for)$", "").trim();
        
        return personName;
    }
    
    /**
     * Validate if a cleaned name looks like a valid person name
     */
    private boolean isValidPersonName(String name) {
        if (name == null || name.isEmpty() || name.length() < 2) return false;
        if (name.matches("\\d+")) return false; // No pure numbers
        if (name.toLowerCase().matches(".*(office|home|library|restaurant|cafe|room|building|street|avenue|drive).*")) return false;
        return true;
    }
    
    /**
     * Regex fallback for assignee extraction - only when OpenNLP fails
     */
    private String extractAssigneeRegexFallback(String input) {
        // More precise pattern that avoids the "with team" issue
        Pattern assigneePattern = Pattern.compile(
            "\\b(?:call|meet(?:ing)?|assigned?\\s+to|for)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)(?=\\s+(?:at\\s+|in\\s+|on\\s+|about|regarding|tomorrow|today|yesterday|next\\s+|\\d)|\\s*$)", 
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = assigneePattern.matcher(input);
        if (matcher.find()) {
            String assignee = matcher.group(1);
            if (isValidPersonName(assignee)) {
                return assignee;
            }
        }
        
        return null;
    }
    
    private String extractProject(String input, NLPResult nlpResult, CompoundTaskInfo compoundInfo) {
        // First check if context provides project information
        if (compoundInfo.context != null && compoundInfo.contextType != null) {
            if (compoundInfo.contextType.toLowerCase().contains("about") || 
                compoundInfo.contextType.toLowerCase().contains("regarding")) {
                // Extract project names from organizations in context
                for (EntityInfo entity : nlpResult.entities) {
                    if ("ORGANIZATION".equals(entity.type)) {
                        return entity.value;
                    }
                }
                
                // If context contains "project", use it
                if (compoundInfo.context.toLowerCase().contains("project")) {
                    String contextProject = compoundInfo.context.replaceAll("(?i)\\bproject\\b", "").trim();
                    if (contextProject.length() > 2) {
                        return contextProject;
                    }
                }
            }
        }
        
        // Look for project-related keywords in main text
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
        
        // Check for organization entities from OpenNLP
        for (EntityInfo entity : nlpResult.entities) {
            if ("ORGANIZATION".equals(entity.type)) {
                return entity.value;
            }
        }
        
        return null;
    }
    
    private TaskPriority extractPriorityWithContext(String input, NLPResult nlpResult, CompoundTaskInfo compoundInfo) {
        // Enhanced priority detection with contextual clues
        
        // Check for explicit priority words
        Matcher priorityMatcher = PRIORITY_WORDS.matcher(input);
        if (priorityMatcher.find()) {
            String priorityWord = priorityMatcher.group(1).toLowerCase();
            return switch (priorityWord) {
                case "urgent", "asap", "high priority", "important", "critical", "must", "have to", "deadline", "due now" -> TaskPriority.HIGH;
                case "low priority", "when possible", "should" -> TaskPriority.LOW;
                case "need to" -> TaskPriority.MEDIUM;
                default -> TaskPriority.MEDIUM;
            };
        }
        
        // Contextual priority inference
        String fullContext = (compoundInfo.context != null ? compoundInfo.context : "") + " " + input;
        
        // High priority indicators
        if (fullContext.toLowerCase().matches(".*(deadline|due|urgent|critical|asap|emergency|immediate).*")) {
            return TaskPriority.HIGH;
        }
        
        // Check for time-sensitive patterns
        if (TIME_SPECIFIC_PATTERNS.matcher(fullContext).find() || 
            fullContext.toLowerCase().matches(".*(today|tomorrow|this morning|this afternoon).*")) {
            return TaskPriority.MEDIUM;
        }
        
        // Business context priority
        if (fullContext.toLowerCase().matches(".*(meeting|presentation|client|boss|manager|ceo).*")) {
            return TaskPriority.MEDIUM;
        }
        
        return TaskPriority.NONE;
    }
    
    private String extractLocation(String input, NLPResult nlpResult) {
        // Trust OpenNLP location entities first - the enhanced detection should find more
        for (EntityInfo entity : nlpResult.entities) {
            if ("LOCATION".equals(entity.type)) {
                return entity.value;
            }
        }
        
        // The OpenNLP service now handles semantic location detection,
        // so we don't need extensive regex fallbacks here anymore
        return null;
    }
    
    private List<String> extractTaskRelationships(String input, NLPResult nlpResult, CompoundTaskInfo compoundInfo) {
        List<String> dependencies = new ArrayList<>();
        
        // Pattern for dependency keywords
        Pattern dependencyPattern = Pattern.compile(
            "\\b(?:after|before|depends\\s+on|wait\\s+for|when|once|if)\\s+([^.,]+?)(?:[.,]|$)",
            Pattern.CASE_INSENSITIVE
        );
        
        String fullContext = input;
        if (compoundInfo.context != null) {
            fullContext = input + " " + compoundInfo.context;
        }
        
        Matcher depMatcher = dependencyPattern.matcher(fullContext);
        while (depMatcher.find()) {
            String dependencyText = depMatcher.group(1).trim();
            
            // Extract potential task titles from the dependency text
            if (dependencyText.length() > 3 && !dependencyText.matches(".*\\b(tomorrow|today|yesterday|next|last|\\d+)\\b.*")) {
                // Clean up the dependency text
                dependencyText = dependencyText.replaceAll("\\b(?:the|a|an|is|are|has|have|been|being)\\b", "").trim();
                if (!dependencyText.isEmpty()) {
                    dependencies.add("task:" + dependencyText.toLowerCase());
                }
            }
        }
        
        // Look for sequential task indicators
        Pattern sequentialPattern = Pattern.compile(
            "\\b(?:then|next|afterwards|subsequently)\\s+([^.,]+?)(?:[.,]|$)",
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher seqMatcher = sequentialPattern.matcher(fullContext);
        while (seqMatcher.find()) {
            String nextTaskText = seqMatcher.group(1).trim();
            if (nextTaskText.length() > 3) {
                dependencies.add("sequence:" + nextTaskText.toLowerCase());
            }
        }
        
        return dependencies;
    }
    
    private String extractDueDate(String input, NLPResult nlpResult, String userTimezone) {
        // Use OpenNLP time expressions first
        for (TimeInfo timeInfo : nlpResult.timeExpressions) {
            ZonedDateTime parsed = parseTimeExpression(timeInfo.value, userTimezone);
            if (parsed != null) {
                return parsed.format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            }
        }
        
        // Fallback to manual pattern matching
        Pattern datePattern = Pattern.compile(
            "\\b(day\\s+after\\s+tomorrow|today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|in\\s+a\\s+week|a\\s+week\\s+from\\s+now|next\\s+week|\\d+\\s+weeks?\\s+from\\s+now|in\\s+\\d+\\s+weeks?|\\d+\\s+days?\\s+from\\s+now|in\\s+\\d+\\s+days?|\\d+/\\d+)\\b",
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
    
    private List<String> extractTags(String input, NLPResult nlpResult) {
        List<String> tags = new ArrayList<>();
        
        // Add contextual tags based on actions and keywords
        Matcher actionMatcher = ACTION_PATTERNS.matcher(input);
        while (actionMatcher.find()) {
            String action = actionMatcher.group(1).toLowerCase();
            tags.add(action);
        }
        
        // Enhanced content-based tagging
        String lowerInput = input.toLowerCase();
        
        // Meeting-related tags
        if (lowerInput.matches(".*(meet|call|catch up|dinner|lunch|coffee|breakfast|appointment|conference|discussion).*")) {
            tags.add("meeting");
        }
        
        // Communication tags
        if (lowerInput.matches(".*(email|mail|message|text|call|phone).*")) {
            tags.add("communication");
        }
        
        // Work-related tags
        if (lowerInput.matches(".*(review|check|analyze|report|presentation|document|file).*")) {
            tags.add("work");
        }
        
        // Personal tags
        if (lowerInput.matches(".*(personal|family|home|doctor|appointment|errands).*")) {
            tags.add("personal");
        }
        
        // Time-sensitive tags
        if (TIME_SPECIFIC_PATTERNS.matcher(input).find() || 
            lowerInput.matches(".*(deadline|urgent|asap|today|tomorrow).*")) {
            tags.add("time-sensitive");
        }
        
        // Priority tags
        if (PRIORITY_WORDS.matcher(input).find()) {
            tags.add("priority");
        }
        
        // Add OpenNLP detected entity types as semantic tags
        for (EntityInfo entity : nlpResult.entities) {
            switch (entity.type) {
                case "PERSON":
                    tags.add("person:" + entity.value.toLowerCase());
                    break;
                case "ORGANIZATION":
                    tags.add("organization:" + entity.value.toLowerCase());
                    break;
                case "LOCATION":
                    tags.add("location:" + entity.value.toLowerCase());
                    break;
            }
        }
        
        // Remove duplicates
        return tags.stream().distinct().collect(java.util.stream.Collectors.toList());
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
            case "day after tomorrow" -> DateTimeUtils.addDaysInUserTimezone(2, userTimezone);
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
            case "day after tomorrow" -> DateTimeUtils.addDaysInUserTimezone(2, userTimezone);
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
