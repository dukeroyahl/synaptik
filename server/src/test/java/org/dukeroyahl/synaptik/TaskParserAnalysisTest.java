package org.dukeroyahl.synaptik;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.service.NaturalLanguageParser;
import org.dukeroyahl.synaptik.service.OpenNLPService;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.PrintWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Comprehensive test program to analyze Apache OpenNLP-based task parser capabilities
 * against 500 diverse task statements. This test provides detailed analysis of:
 * - Priority detection accuracy
 * - Entity extraction success rates
 * - Title extraction and cleaning effectiveness
 * - Assignee detection capabilities
 * - Due date parsing accuracy
 * - Context/description parsing
 */
public class TaskParserAnalysisTest {
    
    private static final String TASK_SENTENCES_FILE = "/Users/arduor/Project/Synaptik-workspace/task_sentences.txt";
    private static final String REPORT_FILE = "/Users/arduor/Project/Synaptik-workspace/Synaptik/server/task_parser_analysis_report.txt";
    
    // Test configuration
    private static final String TEST_TIMEZONE = "America/New_York";
    
    // Analysis categories
    private static final Pattern PRIORITY_INDICATORS = Pattern.compile(
        "\\b(urgent|asap|high\\s+priority|important|critical|low\\s+priority|when\\s+possible|must|should|need\\s+to|have\\s+to|deadline|due\\s+now)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern PERSON_INDICATORS = Pattern.compile(
        "\\b(call|meet|email|with|for|assign)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern TIME_INDICATORS = Pattern.compile(
        "\\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|at\\s+\\d+|by\\s+\\w+|\\d+/\\d+|\\d+:\\d+)\\b",
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ORGANIZATION_INDICATORS = Pattern.compile(
        "\\b([A-Z][a-zA-Z]*(?:\\s+[A-Z][a-zA-Z]*)*(?:\\s+(?:Inc|Corp|LLC|Ltd|Company|Organization|Department|Team|Group))|Microsoft|Google|Apple|IBM|Oracle|Amazon)\\b"
    );
    
    // Analysis results
    private AnalysisResults results;
    private NaturalLanguageParser parser;
    private OpenNLPService nlpService;
    
    public static void main(String[] args) {
        System.out.println("Starting comprehensive task parser analysis...");
        
        TaskParserAnalysisTest analyzer = new TaskParserAnalysisTest();
        try {
            analyzer.runAnalysis();
        } catch (Exception e) {
            System.err.println("Analysis failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void runAnalysis() throws IOException {
        // Initialize services
        initializeServices();
        
        // Initialize results
        results = new AnalysisResults();
        
        // Load and process task sentences
        List<String> taskSentences = loadTaskSentences();
        System.out.printf("Loaded %d task sentences for analysis%n", taskSentences.size());
        
        // Process each task sentence
        processTaskSentences(taskSentences);
        
        // Generate comprehensive report
        generateReport();
        
        System.out.println("Analysis complete! Report saved to: " + REPORT_FILE);
    }
    
    private void initializeServices() {
        // Initialize OpenNLP service (normally done by CDI)
        nlpService = new OpenNLPService();
        nlpService.initializeModels();
        
        // Initialize parser with mock injection
        parser = new NaturalLanguageParser();
        // Use reflection to inject the service since we can't use CDI in standalone mode
        try {
            java.lang.reflect.Field nlpField = NaturalLanguageParser.class.getDeclaredField("nlpService");
            nlpField.setAccessible(true);
            nlpField.set(parser, nlpService);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize parser with NLP service", e);
        }
    }
    
    private List<String> loadTaskSentences() throws IOException {
        List<String> sentences = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(TASK_SENTENCES_FILE))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Skip empty lines, headers, and line numbers
                if (!line.isEmpty() && 
                    !line.startsWith("500 Natural Language") &&
                    !line.startsWith("=") &&
                    !line.matches("^\\d+\\.$")) {
                    
                    // Remove leading number if present (e.g., "1. URGENT: Call...")
                    if (line.matches("^\\d+\\.\\s+.*")) {
                        line = line.replaceFirst("^\\d+\\.\\s+", "");
                    }
                    
                    sentences.add(line);
                }
            }
        }
        
        return sentences;
    }
    
    private void processTaskSentences(List<String> sentences) {
        int processed = 0;
        
        for (String sentence : sentences) {
            try {
                // Parse the task
                Task parsedTask = parser.parseNaturalLanguage(sentence, TEST_TIMEZONE);
                
                // Analyze the parsing results
                analyzeTaskParsing(sentence, parsedTask);
                
                processed++;
                if (processed % 50 == 0) {
                    System.out.printf("Processed %d/%d sentences (%.1f%%)%n", 
                        processed, sentences.size(), (processed * 100.0) / sentences.size());
                }
                
            } catch (Exception e) {
                // Record parsing failures
                results.parsingFailures.add(new ParsingFailure(sentence, e.getMessage()));
                System.err.printf("Failed to parse: %s - %s%n", sentence, e.getMessage());
            }
        }
        
        results.totalProcessed = processed;
        results.totalSentences = sentences.size();
    }
    
    private void analyzeTaskParsing(String originalSentence, Task parsedTask) {
        TaskAnalysis analysis = new TaskAnalysis(originalSentence, parsedTask);
        
        // Analyze priority detection
        analyzePriorityDetection(analysis);
        
        // Analyze entity extraction
        analyzeEntityExtraction(analysis);
        
        // Analyze title extraction
        analyzeTitleExtraction(analysis);
        
        // Analyze assignee detection
        analyzeAssigneeDetection(analysis);
        
        // Analyze due date parsing
        analyzeDueDateParsing(analysis);
        
        // Analyze context/description parsing
        analyzeContextParsing(analysis);
        
        // Store the analysis
        results.taskAnalyses.add(analysis);
    }
    
    private void analyzePriorityDetection(TaskAnalysis analysis) {
        // Check if original sentence contains priority indicators
        boolean hasPriorityIndicator = PRIORITY_INDICATORS.matcher(analysis.originalSentence).find();
        boolean detectedPriority = analysis.parsedTask.priority != TaskPriority.NONE;
        
        analysis.priorityExpected = hasPriorityIndicator;
        analysis.priorityDetected = detectedPriority;
        analysis.priorityValue = analysis.parsedTask.priority;
        
        if (hasPriorityIndicator && detectedPriority) {
            results.priorityDetectionSuccesses++;
        } else if (hasPriorityIndicator && !detectedPriority) {
            results.priorityDetectionMisses++;
            results.priorityMissExamples.add(analysis.originalSentence);
        } else if (!hasPriorityIndicator && detectedPriority) {
            results.priorityFalsePositives++;
        } else {
            results.priorityCorrectNegatives++;
        }
    }
    
    private void analyzeEntityExtraction(TaskAnalysis analysis) {
        // Check for person entities
        boolean hasPersonIndicator = PERSON_INDICATORS.matcher(analysis.originalSentence).find();
        boolean detectedPerson = analysis.parsedTask.assignee != null && !analysis.parsedTask.assignee.isEmpty();
        
        analysis.personExpected = hasPersonIndicator;
        analysis.personDetected = detectedPerson;
        analysis.personValue = analysis.parsedTask.assignee;
        
        if (hasPersonIndicator && detectedPerson) {
            results.personExtractionSuccesses++;
        } else if (hasPersonIndicator && !detectedPerson) {
            results.personExtractionMisses++;
            results.personMissExamples.add(analysis.originalSentence);
        }
        
        // Check for organization entities
        boolean hasOrgIndicator = ORGANIZATION_INDICATORS.matcher(analysis.originalSentence).find();
        boolean detectedOrg = analysis.parsedTask.project != null && !analysis.parsedTask.project.isEmpty() ||
                             analysis.parsedTask.tags.stream().anyMatch(tag -> tag.startsWith("organization:"));
        
        analysis.organizationExpected = hasOrgIndicator;
        analysis.organizationDetected = detectedOrg;
        
        if (hasOrgIndicator && detectedOrg) {
            results.organizationExtractionSuccesses++;
        } else if (hasOrgIndicator && !detectedOrg) {
            results.organizationExtractionMisses++;
            results.organizationMissExamples.add(analysis.originalSentence);
        }
        
        // Check for time/date entities
        boolean hasTimeIndicator = TIME_INDICATORS.matcher(analysis.originalSentence).find();
        boolean detectedTime = analysis.parsedTask.dueDate != null && !analysis.parsedTask.dueDate.isEmpty();
        
        analysis.timeExpected = hasTimeIndicator;
        analysis.timeDetected = detectedTime;
        analysis.timeValue = analysis.parsedTask.dueDate;
        
        if (hasTimeIndicator && detectedTime) {
            results.timeExtractionSuccesses++;
        } else if (hasTimeIndicator && !detectedTime) {
            results.timeExtractionMisses++;
            results.timeMissExamples.add(analysis.originalSentence);
        }
    }
    
    private void analyzeTitleExtraction(TaskAnalysis analysis) {
        String title = analysis.parsedTask.title;
        analysis.titleValue = title;
        
        // Check title quality
        if (title == null || title.isEmpty() || "Untitled Task".equals(title)) {
            results.titleExtractionFailures++;
            results.titleFailureExamples.add(analysis.originalSentence);
        } else {
            results.titleExtractionSuccesses++;
            
            // Check if title contains priority words (should be cleaned)
            if (PRIORITY_INDICATORS.matcher(title).find()) {
                results.titleCleaningIssues++;
                results.titleCleaningExamples.add(String.format("Original: %s -> Title: %s", 
                    analysis.originalSentence, title));
            }
        }
    }
    
    private void analyzeAssigneeDetection(TaskAnalysis analysis) {
        // This is covered in entity extraction, but we can add specific assignee logic here
        if (analysis.personDetected && analysis.personValue != null) {
            // Check if the detected person makes sense as an assignee
            String[] commonNonPersonWords = {"office", "home", "meeting", "room", "building", "today", "tomorrow"};
            boolean isLikelyPerson = Arrays.stream(commonNonPersonWords)
                .noneMatch(word -> analysis.personValue.toLowerCase().contains(word));
            
            if (!isLikelyPerson) {
                results.assigneeDetectionErrors++;
                results.assigneeErrorExamples.add(String.format("Sentence: %s -> Detected: %s", 
                    analysis.originalSentence, analysis.personValue));
            }
        }
    }
    
    private void analyzeDueDateParsing(TaskAnalysis analysis) {
        if (analysis.timeDetected && analysis.timeValue != null) {
            try {
                // Try to parse the date to validate it
                java.time.ZonedDateTime.parse(analysis.timeValue);
                results.dueDateParsingSuccesses++;
            } catch (Exception e) {
                results.dueDateParsingErrors++;
                results.dueDateErrorExamples.add(String.format("Sentence: %s -> Date: %s -> Error: %s", 
                    analysis.originalSentence, analysis.timeValue, e.getMessage()));
            }
        }
    }
    
    private void analyzeContextParsing(TaskAnalysis analysis) {
        String description = analysis.parsedTask.description;
        analysis.contextValue = description;
        
        if (description != null && !description.isEmpty()) {
            results.contextExtractionSuccesses++;
        }
        
        // Analyze tags
        int tagCount = analysis.parsedTask.tags.size();
        analysis.tagCount = tagCount;
        
        if (tagCount > 0) {
            results.tagExtractionSuccesses++;
        }
    }
    
    private void generateReport() throws IOException {
        try (PrintWriter writer = new PrintWriter(REPORT_FILE)) {
            writeReportHeader(writer);
            writeExecutiveSummary(writer);
            writeDetailedAnalysis(writer);
            writeSuccessExamples(writer);
            writeFailureExamples(writer);
            writeRecommendations(writer);
        }
    }
    
    private void writeReportHeader(PrintWriter writer) {
        writer.println("=".repeat(80));
        writer.println("COMPREHENSIVE TASK PARSER ANALYSIS REPORT");
        writer.println("=".repeat(80));
        writer.println("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        writer.println("Test File: " + TASK_SENTENCES_FILE);
        writer.println("Total Sentences Analyzed: " + results.totalSentences);
        writer.println("Successfully Processed: " + results.totalProcessed);
        writer.println("Parsing Failures: " + results.parsingFailures.size());
        writer.println("OpenNLP Available: " + nlpService.isOpenNLPAvailable());
        writer.println();
    }
    
    private void writeExecutiveSummary(PrintWriter writer) {
        writer.println("EXECUTIVE SUMMARY");
        writer.println("-".repeat(40));
        
        // Calculate success rates
        double prioritySuccessRate = calculateSuccessRate(results.priorityDetectionSuccesses, 
            results.priorityDetectionSuccesses + results.priorityDetectionMisses);
        
        double personSuccessRate = calculateSuccessRate(results.personExtractionSuccesses,
            results.personExtractionSuccesses + results.personExtractionMisses);
        
        double orgSuccessRate = calculateSuccessRate(results.organizationExtractionSuccesses,
            results.organizationExtractionSuccesses + results.organizationExtractionMisses);
        
        double timeSuccessRate = calculateSuccessRate(results.timeExtractionSuccesses,
            results.timeExtractionSuccesses + results.timeExtractionMisses);
        
        double titleSuccessRate = calculateSuccessRate(results.titleExtractionSuccesses,
            results.titleExtractionSuccesses + results.titleExtractionFailures);
        
        writer.printf("Priority Detection Success Rate: %.1f%% (%d/%d)%n", 
            prioritySuccessRate, results.priorityDetectionSuccesses, 
            results.priorityDetectionSuccesses + results.priorityDetectionMisses);
        
        writer.printf("Person Entity Extraction Success Rate: %.1f%% (%d/%d)%n",
            personSuccessRate, results.personExtractionSuccesses,
            results.personExtractionSuccesses + results.personExtractionMisses);
        
        writer.printf("Organization Entity Extraction Success Rate: %.1f%% (%d/%d)%n",
            orgSuccessRate, results.organizationExtractionSuccesses,
            results.organizationExtractionSuccesses + results.organizationExtractionMisses);
        
        writer.printf("Time/Date Extraction Success Rate: %.1f%% (%d/%d)%n",
            timeSuccessRate, results.timeExtractionSuccesses,
            results.timeExtractionSuccesses + results.timeExtractionMisses);
        
        writer.printf("Title Extraction Success Rate: %.1f%% (%d/%d)%n",
            titleSuccessRate, results.titleExtractionSuccesses,
            results.titleExtractionSuccesses + results.titleExtractionFailures);
        
        writer.printf("Context/Description Extraction Rate: %.1f%% (%d/%d)%n",
            calculateSuccessRate(results.contextExtractionSuccesses, results.totalProcessed),
            results.contextExtractionSuccesses, results.totalProcessed);
        
        writer.printf("Tag Extraction Rate: %.1f%% (%d/%d)%n",
            calculateSuccessRate(results.tagExtractionSuccesses, results.totalProcessed),
            results.tagExtractionSuccesses, results.totalProcessed);
        
        writer.println();
    }
    
    private void writeDetailedAnalysis(PrintWriter writer) {
        writer.println("DETAILED ANALYSIS");
        writer.println("-".repeat(40));
        
        // Priority Analysis
        writer.println("\nPRIORITY DETECTION ANALYSIS:");
        writer.printf("  Successful detections: %d%n", results.priorityDetectionSuccesses);
        writer.printf("  Missed detections: %d%n", results.priorityDetectionMisses);
        writer.printf("  False positives: %d%n", results.priorityFalsePositives);
        writer.printf("  Correct negatives: %d%n", results.priorityCorrectNegatives);
        
        // Entity Extraction Analysis
        writer.println("\nENTITY EXTRACTION ANALYSIS:");
        writer.printf("  Person extractions - Success: %d, Missed: %d, Errors: %d%n", 
            results.personExtractionSuccesses, results.personExtractionMisses, results.assigneeDetectionErrors);
        writer.printf("  Organization extractions - Success: %d, Missed: %d%n", 
            results.organizationExtractionSuccesses, results.organizationExtractionMisses);
        writer.printf("  Time/Date extractions - Success: %d, Missed: %d, Parse Errors: %d%n", 
            results.timeExtractionSuccesses, results.timeExtractionMisses, results.dueDateParsingErrors);
        
        // Title and Content Analysis
        writer.println("\nTITLE AND CONTENT ANALYSIS:");
        writer.printf("  Title extraction - Success: %d, Failures: %d, Cleaning Issues: %d%n", 
            results.titleExtractionSuccesses, results.titleExtractionFailures, results.titleCleaningIssues);
        writer.printf("  Context extraction successes: %d%n", results.contextExtractionSuccesses);
        writer.printf("  Tag extraction successes: %d%n", results.tagExtractionSuccesses);
        
        // Task Categories Analysis
        writer.println("\nTASK CATEGORIES THAT WORK WELL:");
        Map<String, Integer> successfulCategories = categorizeSuccessfulTasks();
        successfulCategories.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10)
            .forEach(entry -> writer.printf("  %s: %d successful parses%n", entry.getKey(), entry.getValue()));
        
        writer.println("\nTASK CATEGORIES THAT STRUGGLE:");
        Map<String, Integer> strugglingCategories = categorizeStrugglingTasks();
        strugglingCategories.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(10)
            .forEach(entry -> writer.printf("  %s: %d issues%n", entry.getKey(), entry.getValue()));
        
        writer.println();
    }
    
    private void writeSuccessExamples(PrintWriter writer) {
        writer.println("SUCCESS EXAMPLES");
        writer.println("-".repeat(40));
        
        // Find best parsing examples
        List<TaskAnalysis> successfulExamples = results.taskAnalyses.stream()
            .filter(this::isSuccessfulParse)
            .limit(10)
            .collect(Collectors.toList());
        
        writer.println("\nEXCELLENT PARSING EXAMPLES:");
        for (TaskAnalysis analysis : successfulExamples) {
            writer.printf("Original: %s%n", analysis.originalSentence);
            writer.printf("  Title: %s%n", analysis.titleValue);
            writer.printf("  Priority: %s%n", analysis.priorityValue);
            writer.printf("  Assignee: %s%n", analysis.personValue);
            writer.printf("  Due Date: %s%n", analysis.timeValue);
            writer.printf("  Context: %s%n", analysis.contextValue);
            writer.printf("  Tags: %d extracted%n", analysis.tagCount);
            writer.println();
        }
    }
    
    private void writeFailureExamples(PrintWriter writer) {
        writer.println("FAILURE EXAMPLES AND ANALYSIS");
        writer.println("-".repeat(40));
        
        writer.println("\nPRIORITY DETECTION MISSES:");
        results.priorityMissExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nPERSON EXTRACTION MISSES:");
        results.personMissExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nORGANIZATION EXTRACTION MISSES:");
        results.organizationMissExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nTIME/DATE EXTRACTION MISSES:");
        results.timeMissExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nTITLE EXTRACTION FAILURES:");
        results.titleFailureExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nTITLE CLEANING ISSUES:");
        results.titleCleaningExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nASSIGNEE DETECTION ERRORS:");
        results.assigneeErrorExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nDUE DATE PARSING ERRORS:");
        results.dueDateErrorExamples.stream().limit(5).forEach(example -> 
            writer.printf("  - %s%n", example));
        
        writer.println("\nPARSING FAILURES:");
        results.parsingFailures.stream().limit(5).forEach(failure -> 
            writer.printf("  - %s (Error: %s)%n", failure.sentence, failure.error));
        
        writer.println();
    }
    
    private void writeRecommendations(PrintWriter writer) {
        writer.println("RECOMMENDATIONS FOR IMPROVEMENT");
        writer.println("-".repeat(40));
        
        writer.println("\nHIGH PRIORITY IMPROVEMENTS:");
        
        // Priority detection improvements
        if (results.priorityDetectionMisses > results.priorityDetectionSuccesses * 0.3) {
            writer.println("1. PRIORITY DETECTION: Enhance priority keyword patterns");
            writer.println("   - Add more priority indicators (e.g., 'immediate', 'pressing', 'time-sensitive')");
            writer.println("   - Improve contextual priority inference");
            writer.println("   - Consider sentiment analysis for urgency detection");
        }
        
        // Entity extraction improvements
        if (results.personExtractionMisses > results.personExtractionSuccesses * 0.3) {
            writer.println("2. PERSON ENTITY EXTRACTION: Improve name detection");
            writer.println("   - Enhance regex patterns for person names");
            writer.println("   - Add common name dictionaries");
            writer.println("   - Improve context-based person identification");
        }
        
        if (results.organizationExtractionMisses > results.organizationExtractionSuccesses * 0.3) {
            writer.println("3. ORGANIZATION ENTITY EXTRACTION: Expand organization patterns");
            writer.println("   - Add more company name patterns");
            writer.println("   - Include department and team names");
            writer.println("   - Improve acronym detection (e.g., 'HR', 'IT', 'QA')");
        }
        
        // Time/date improvements
        if (results.timeExtractionMisses > results.timeExtractionSuccesses * 0.3) {
            writer.println("4. TIME/DATE EXTRACTION: Enhance temporal parsing");
            writer.println("   - Add more date format patterns");
            writer.println("   - Improve relative date parsing ('next Friday', 'in 2 weeks')");
            writer.println("   - Handle complex time expressions better");
        }
        
        // Title cleaning improvements
        if (results.titleCleaningIssues > results.titleExtractionSuccesses * 0.1) {
            writer.println("5. TITLE CLEANING: Improve title extraction quality");
            writer.println("   - Better removal of priority keywords from titles");
            writer.println("   - Preserve important context while cleaning");
            writer.println("   - Handle compound sentences more effectively");
        }
        
        writer.println("\nMEDIUM PRIORITY IMPROVEMENTS:");
        writer.println("6. CONTEXT EXTRACTION: Enhance description parsing");
        writer.println("   - Better identification of task context vs. main action");
        writer.println("   - Preserve important details in descriptions");
        
        writer.println("7. TAG GENERATION: Improve automatic tagging");
        writer.println("   - Add more semantic tags based on task content");
        writer.println("   - Improve action-based tag extraction");
        
        writer.println("8. ERROR HANDLING: Robust parsing");
        writer.println("   - Better handling of malformed input");
        writer.println("   - Graceful degradation when NLP models fail");
        
        writer.println("\nLOW PRIORITY IMPROVEMENTS:");
        writer.println("9. PERFORMANCE: Optimize parsing speed");
        writer.println("10. EXTENSIBILITY: Make patterns more configurable");
        
        writer.println();
        writer.println("=".repeat(80));
        writer.println("END OF ANALYSIS REPORT");
        writer.println("=".repeat(80));
    }
    
    private double calculateSuccessRate(int successes, int total) {
        return total > 0 ? (successes * 100.0) / total : 0.0;
    }
    
    private boolean isSuccessfulParse(TaskAnalysis analysis) {
        int successCount = 0;
        int totalChecks = 0;
        
        // Check priority detection
        if (analysis.priorityExpected) {
            totalChecks++;
            if (analysis.priorityDetected) successCount++;
        }
        
        // Check person extraction
        if (analysis.personExpected) {
            totalChecks++;
            if (analysis.personDetected) successCount++;
        }
        
        // Check time extraction
        if (analysis.timeExpected) {
            totalChecks++;
            if (analysis.timeDetected) successCount++;
        }
        
        // Check title quality
        totalChecks++;
        if (analysis.titleValue != null && !analysis.titleValue.isEmpty() && 
            !"Untitled Task".equals(analysis.titleValue)) {
            successCount++;
        }
        
        return totalChecks > 0 && (successCount / (double) totalChecks) >= 0.8;
    }
    
    private Map<String, Integer> categorizeSuccessfulTasks() {
        Map<String, Integer> categories = new HashMap<>();
        
        for (TaskAnalysis analysis : results.taskAnalyses) {
            if (isSuccessfulParse(analysis)) {
                String category = categorizeTask(analysis.originalSentence);
                categories.merge(category, 1, Integer::sum);
            }
        }
        
        return categories;
    }
    
    private Map<String, Integer> categorizeStrugglingTasks() {
        Map<String, Integer> categories = new HashMap<>();
        
        for (TaskAnalysis analysis : results.taskAnalyses) {
            if (!isSuccessfulParse(analysis)) {
                String category = categorizeTask(analysis.originalSentence);
                categories.merge(category, 1, Integer::sum);
            }
        }
        
        return categories;
    }
    
    private String categorizeTask(String sentence) {
        String lower = sentence.toLowerCase();
        
        if (lower.contains("call") || lower.contains("phone")) return "Communication - Calls";
        if (lower.contains("email") || lower.contains("mail")) return "Communication - Email";
        if (lower.contains("meet") || lower.contains("meeting")) return "Meetings";
        if (lower.contains("review") || lower.contains("check")) return "Review Tasks";
        if (lower.contains("send") || lower.contains("deliver")) return "Delivery Tasks";
        if (lower.contains("fix") || lower.contains("bug") || lower.contains("debug")) return "Technical Tasks";
        if (lower.contains("schedule") || lower.contains("plan")) return "Planning Tasks";
        if (lower.contains("buy") || lower.contains("purchase")) return "Purchase Tasks";
        if (lower.contains("write") || lower.contains("document")) return "Documentation Tasks";
        if (lower.contains("urgent") || lower.contains("critical") || lower.contains("asap")) return "Urgent Tasks";
        
        return "General Tasks";
    }
    
    // Data classes for analysis
    private static class AnalysisResults {
        int totalSentences;
        int totalProcessed;
        
        int priorityDetectionSuccesses;
        int priorityDetectionMisses;
        int priorityFalsePositives;
        int priorityCorrectNegatives;
        
        int personExtractionSuccesses;
        int personExtractionMisses;
        int organizationExtractionSuccesses;
        int organizationExtractionMisses;
        int timeExtractionSuccesses;
        int timeExtractionMisses;
        
        int titleExtractionSuccesses;
        int titleExtractionFailures;
        int titleCleaningIssues;
        
        int assigneeDetectionErrors;
        int dueDateParsingSuccesses;
        int dueDateParsingErrors;
        
        int contextExtractionSuccesses;
        int tagExtractionSuccesses;
        
        List<String> priorityMissExamples = new ArrayList<>();
        List<String> personMissExamples = new ArrayList<>();
        List<String> organizationMissExamples = new ArrayList<>();
        List<String> timeMissExamples = new ArrayList<>();
        List<String> titleFailureExamples = new ArrayList<>();
        List<String> titleCleaningExamples = new ArrayList<>();
        List<String> assigneeErrorExamples = new ArrayList<>();
        List<String> dueDateErrorExamples = new ArrayList<>();
        
        List<ParsingFailure> parsingFailures = new ArrayList<>();
        List<TaskAnalysis> taskAnalyses = new ArrayList<>();
    }
    
    private static class TaskAnalysis {
        String originalSentence;
        Task parsedTask;
        
        boolean priorityExpected;
        boolean priorityDetected;
        TaskPriority priorityValue;
        
        boolean personExpected;
        boolean personDetected;
        String personValue;
        
        boolean organizationExpected;
        boolean organizationDetected;
        
        boolean timeExpected;
        boolean timeDetected;
        String timeValue;
        
        String titleValue;
        String contextValue;
        int tagCount;
        
        TaskAnalysis(String originalSentence, Task parsedTask) {
            this.originalSentence = originalSentence;
            this.parsedTask = parsedTask;
        }
    }
    
    private static class ParsingFailure {
        String sentence;
        String error;
        
        ParsingFailure(String sentence, String error) {
            this.sentence = sentence;
            this.error = error;
        }
    }
}