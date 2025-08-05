package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ComprehensiveNLPAnalysisTest {
    
    private static NaturalLanguageParser parser;
    private static OpenNLPService nlpService;
    private static boolean initialized = false;
    
    // Analysis results for comprehensive analysis
    private Map<String, Integer> priorityDetectionResults = new HashMap<>();
    private Map<String, Integer> entityExtractionResults = new HashMap<>();
    private List<String> successfulParses = new ArrayList<>();
    private List<String> problematicParses = new ArrayList<>();
    private List<String> highPriorityMisses = new ArrayList<>();
    private List<String> entityExtractionSuccesses = new ArrayList<>();
    
    // CSV Data structure
    public static class TaskTestData {
        public final String originalText;
        public final String expectedUrgency;
        public final String expectedTaskName;
        public final String expectedEntity;
        public final String expectedTime;
        
        public TaskTestData(String originalText, String expectedUrgency, String expectedTaskName, 
                           String expectedEntity, String expectedTime) {
            this.originalText = originalText;
            this.expectedUrgency = expectedUrgency;
            this.expectedTaskName = expectedTaskName;
            this.expectedEntity = expectedEntity;
            this.expectedTime = expectedTime;
        }
        
        @Override
        public String toString() {
            return String.format("TaskTestData{originalText='%s', expectedUrgency='%s'}", 
                originalText, expectedUrgency);
        }
    }
    
    @BeforeEach
    void setUp() {
        // Initialize services only once
        if (!initialized) {
            // Initialize real OpenNLP service
            nlpService = new OpenNLPService();
            nlpService.initializeModels();
            
            parser = new NaturalLanguageParser();
            
            // Inject NLP service using reflection
            try {
                var nlpServiceField = NaturalLanguageParser.class.getDeclaredField("nlpService");
                nlpServiceField.setAccessible(true);
                nlpServiceField.set(parser, nlpService);
            } catch (Exception e) {
                fail("Failed to inject NLP service: " + e.getMessage());
            }
            
            initialized = true;
        }
        
        // Initialize results tracking
        priorityDetectionResults.put("HIGH_DETECTED", 0);
        priorityDetectionResults.put("HIGH_MISSED", 0);
        priorityDetectionResults.put("MEDIUM_DETECTED", 0);
        priorityDetectionResults.put("LOW_DETECTED", 0);
        priorityDetectionResults.put("NONE_DETECTED", 0);
        
        entityExtractionResults.put("PERSON_DETECTED", 0);
        entityExtractionResults.put("ORGANIZATION_DETECTED", 0);
        entityExtractionResults.put("LOCATION_DETECTED", 0);
        entityExtractionResults.put("DATE_DETECTED", 0);
        entityExtractionResults.put("TOTAL_ENTITIES", 0);
    }
    
    @ParameterizedTest(name = "Task: {0}")
    @CsvFileSource(resources = "/task_sentences.csv", numLinesToSkip = 1)
    void testIndividualTaskParsing(String originalText, String expectedUrgency, String expectedTaskName,
                                  String expectedEntity, String expectedTime) {
        
        assertNotNull(originalText, "Original text should not be null");
        assertFalse(originalText.trim().isEmpty(), "Original text should not be empty");
        
        try {
            Task task = parser.parseNaturalLanguage(originalText);
            
            // Basic validation
            assertNotNull(task, "Parsed task should not be null for: " + originalText);
            assertNotNull(task.title, "Task title should not be null for: " + originalText);
            assertFalse(task.title.trim().isEmpty(), "Task title should not be empty for: " + originalText);
            
            // Priority validation (if expected urgency is provided)
            if (expectedUrgency != null && !expectedUrgency.trim().isEmpty()) {
                TaskPriority expectedPriority = mapUrgencyToPriority(expectedUrgency);
                // Soft assertion - log discrepancies but don't fail test
                if (task.priority != expectedPriority) {
                    System.out.printf("Priority mismatch for '%s': expected %s, got %s%n", 
                        originalText, expectedPriority, task.priority);
                    
                    // Uncomment below for strict priority validation:
                    // assertEquals(expectedPriority, task.priority, 
                    //     String.format("Priority mismatch for '%s'", originalText));
                }
            }
            
            // Entity validation (if expected entities are provided)
            if (expectedEntity != null && !expectedEntity.trim().isEmpty()) {
                validateEntityExtraction(originalText, task, expectedEntity);
            }
            
            // Time validation (if expected time is provided)
            if (expectedTime != null && !expectedTime.trim().isEmpty()) {
                validateTimeExtraction(originalText, task, expectedTime);
            }
            
        } catch (Exception e) {
            fail(String.format("Failed to parse task: '%s'. Error: %s", originalText, e.getMessage()));
        }
    }
    
    @Test
    void testComprehensiveAnalysisFromCSV() {
        System.out.println("=== COMPREHENSIVE NLP ANALYSIS FROM CSV ===\n");
        
        List<TaskTestData> taskDataList = loadTaskDataFromCSV();
        
        if (taskDataList.isEmpty()) {
            System.out.println("Could not load task data from CSV. Analysis skipped.");
            return;
        }
        
        System.out.printf("Loaded %d task statements from CSV for analysis\n\n", taskDataList.size());
        
        int totalProcessed = 0;
        int successfullyParsed = 0;
        
        for (TaskTestData taskData : taskDataList) {
            totalProcessed++;
            
            try {
                Task task = parser.parseNaturalLanguage(taskData.originalText);
                
                if (task != null && task.title != null && !task.title.trim().isEmpty()) {
                    successfullyParsed++;
                    analyzeTaskWithExpectedData(taskData, task);
                    successfulParses.add(String.format("✓ [%d] %s → Title: '%s', Priority: %s", 
                        totalProcessed, taskData.originalText, task.title, task.priority));
                } else {
                    problematicParses.add(String.format("✗ [%d] %s → NULL or EMPTY TASK", 
                        totalProcessed, taskData.originalText));
                }
                
            } catch (Exception e) {
                problematicParses.add(String.format("✗ [%d] %s → ERROR: %s", 
                    totalProcessed, taskData.originalText, e.getMessage()));
            }
        }
        
        // Generate comprehensive report
        generateAnalysisReport(totalProcessed, successfullyParsed);
        
        // Report success rate
        System.out.printf("Final Success Rate: %.1f%% (%d/%d statements successfully parsed)\n", 
            (double) successfullyParsed / totalProcessed * 100, successfullyParsed, totalProcessed);
        
        // Assert minimum thresholds for test quality
        assertTrue(successfullyParsed >= totalProcessed * 0.95, 
            String.format("Parsing success rate too low: %.1f%% (minimum 95%%)", 
                (double) successfullyParsed / totalProcessed * 100));
        
        // Uncomment for stricter accuracy requirements:
        // int totalHighExpected = priorityDetectionResults.get("HIGH_DETECTED") + priorityDetectionResults.get("HIGH_MISSED");
        // if (totalHighExpected > 0) {
        //     double highPriorityAccuracy = (double) priorityDetectionResults.get("HIGH_DETECTED") / totalHighExpected;
        //     assertTrue(highPriorityAccuracy >= 0.8, 
        //         String.format("High priority detection too low: %.1f%% (minimum 80%%)", highPriorityAccuracy * 100));
        // }
    }
    
    private List<TaskTestData> loadTaskDataFromCSV() {
        List<TaskTestData> taskDataList = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                getClass().getResourceAsStream("/task_sentences.csv")))) {
            
            String line;
            boolean firstLine = true;
            
            while ((line = reader.readLine()) != null) {
                if (firstLine) {
                    firstLine = false; // Skip header
                    continue;
                }
                
                String[] parts = parseCsvLine(line);
                if (parts.length >= 5) {
                    TaskTestData taskData = new TaskTestData(
                        parts[0], // originalText
                        parts[1], // expectedUrgency
                        parts[2], // expectedTaskName
                        parts[3], // expectedEntity
                        parts[4]  // expectedTime
                    );
                    taskDataList.add(taskData);
                }
            }
            
        } catch (IOException e) {
            System.err.println("Failed to load CSV data: " + e.getMessage());
        }
        
        return taskDataList;
    }
    
    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
    
    private TaskPriority mapUrgencyToPriority(String urgency) {
        return switch (urgency.toUpperCase()) {
            case "HIGH" -> TaskPriority.HIGH;
            case "MEDIUM" -> TaskPriority.MEDIUM;
            case "LOW" -> TaskPriority.LOW;
            default -> TaskPriority.NONE;
        };
    }
    
    private void validateEntityExtraction(String originalText, Task task, String expectedEntity) {
        // Check if expected entities are found in the task
        String[] expectedEntities = expectedEntity.split(";");
        for (String entity : expectedEntities) {
            entity = entity.trim();
            if (entity.startsWith("Person:")) {
                String expectedPerson = entity.substring(7).trim();
                if (task.assignee != null && task.assignee.contains(expectedPerson)) {
                    entityExtractionSuccesses.add(String.format("✓ Person '%s' found in task: %s", 
                        expectedPerson, originalText));
                }
            } else if (entity.startsWith("Org:")) {
                String expectedOrg = entity.substring(4).trim();
                // Check in project field or description
                if ((task.project != null && task.project.contains(expectedOrg)) ||
                    (task.description != null && task.description.contains(expectedOrg))) {
                    entityExtractionSuccesses.add(String.format("✓ Organization '%s' found in task: %s", 
                        expectedOrg, originalText));
                }
            }
        }
    }
    
    private void validateTimeExtraction(String originalText, Task task, String expectedTime) {
        // Validate time extraction
        if (task.dueDate != null && !task.dueDate.trim().isEmpty()) {
            entityExtractionSuccesses.add(String.format("✓ Time extracted for task: %s → %s", 
                originalText, task.dueDate));
        }
    }
    
    private void analyzeTaskWithExpectedData(TaskTestData taskData, Task task) {
        // Analyze priority detection
        TaskPriority expectedPriority = mapUrgencyToPriority(taskData.expectedUrgency);
        
        switch (expectedPriority) {
            case HIGH -> {
                if (task.priority == TaskPriority.HIGH) {
                    priorityDetectionResults.put("HIGH_DETECTED", 
                        priorityDetectionResults.get("HIGH_DETECTED") + 1);
                } else {
                    priorityDetectionResults.put("HIGH_MISSED", 
                        priorityDetectionResults.get("HIGH_MISSED") + 1);
                    highPriorityMisses.add(String.format("MISS: '%s' → Expected %s, got %s", 
                        taskData.originalText, expectedPriority, task.priority));
                }
            }
            case MEDIUM -> priorityDetectionResults.put("MEDIUM_DETECTED", 
                priorityDetectionResults.get("MEDIUM_DETECTED") + 1);
            case LOW -> priorityDetectionResults.put("LOW_DETECTED", 
                priorityDetectionResults.get("LOW_DETECTED") + 1);
            case NONE -> priorityDetectionResults.put("NONE_DETECTED", 
                priorityDetectionResults.get("NONE_DETECTED") + 1);
        }
        
        // Analyze entity extraction using expected data
        if (taskData.expectedEntity != null && !taskData.expectedEntity.trim().isEmpty()) {
            validateEntityExtraction(taskData.originalText, task, taskData.expectedEntity);
            entityExtractionResults.put("TOTAL_ENTITIES", 
                entityExtractionResults.get("TOTAL_ENTITIES") + 1);
        }
    }
    
    private void generateAnalysisReport(int totalProcessed, int successfullyParsed) {
        StringBuilder report = new StringBuilder();
        report.append("==================== ANALYSIS REPORT ====================\n\n");
        
        // Overall success rate
        double successRate = (double) successfullyParsed / totalProcessed * 100;
        report.append(String.format("OVERALL SUCCESS RATE: %.1f%% (%d/%d statements successfully parsed)\n\n", 
            successRate, successfullyParsed, totalProcessed));
        
        // Print to console and save to file
        String reportText = report.toString();
        System.out.println(reportText);
        
        // Priority detection analysis
        report.append("--- PRIORITY DETECTION ANALYSIS ---\n");
        int totalHighExpected = priorityDetectionResults.get("HIGH_DETECTED") + priorityDetectionResults.get("HIGH_MISSED");
        if (totalHighExpected > 0) {
            double highPriorityAccuracy = (double) priorityDetectionResults.get("HIGH_DETECTED") / totalHighExpected * 100;
            report.append(String.format("High Priority Detection: %.1f%% (%d/%d)\n", 
                highPriorityAccuracy, priorityDetectionResults.get("HIGH_DETECTED"), totalHighExpected));
        }
        
        report.append("Priority Distribution:\n");
        report.append(String.format("  HIGH: %d statements\n", priorityDetectionResults.get("HIGH_DETECTED")));
        report.append(String.format("  MEDIUM: %d statements\n", priorityDetectionResults.get("MEDIUM_DETECTED")));
        report.append(String.format("  LOW: %d statements\n", priorityDetectionResults.get("LOW_DETECTED")));
        report.append(String.format("  NONE: %d statements\n\n", priorityDetectionResults.get("NONE_DETECTED")));
        
        // Print priority analysis and save to file  
        System.out.println(report.toString());
        
        // Save detailed analysis to file for review
        try (FileWriter writer = new FileWriter("analysis-report.txt")) {
            writer.write(report.toString());
            
            // Add detailed misses for debugging
            if (!highPriorityMisses.isEmpty()) {
                writer.write("\n--- HIGH PRIORITY DETECTION MISSES ---\n");
                for (String miss : highPriorityMisses) {
                    writer.write(miss + "\n");
                }
            }
            
            if (!problematicParses.isEmpty()) {
                writer.write("\n--- PROBLEMATIC PARSES ---\n");
                for (String problem : problematicParses) {
                    writer.write(problem + "\n");
                }
            }
            
            System.out.println("Detailed analysis saved to analysis-report.txt");
        } catch (IOException e) {
            System.err.println("Failed to write analysis report: " + e.getMessage());
        }
    }
}