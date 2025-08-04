package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class UrgencyDetectionTest {
    
    private NaturalLanguageParser parser;
    private OpenNLPService nlpService;
    
    @BeforeEach
    void setUp() {
        // Use real OpenNLP service
        nlpService = new OpenNLPService();
        nlpService.initializeModels();
        
        parser = new NaturalLanguageParser();
        
        // Inject real NLP service using reflection
        try {
            var nlpServiceField = NaturalLanguageParser.class.getDeclaredField("nlpService");
            nlpServiceField.setAccessible(true);
            nlpServiceField.set(parser, nlpService);
        } catch (Exception e) {
            fail("Failed to inject NLP service: " + e.getMessage());
        }
    }
    
    @ParameterizedTest(name = "Should detect urgency: {0} -> Priority: {1}")
    @CsvSource({
        "'URGENT: Fix production bug immediately', HIGH",
        "'Send urgent email to client about contract', HIGH", 
        "'Critical issue with payment system ASAP', HIGH",
        "'Emergency: Server is down!', HIGH", 
        "'Important meeting with CEO tomorrow', HIGH",
        "'Must complete report by end of day', HIGH",
        "'Send regular email to teammate', NONE",
        "'Write documentation when possible', LOW"
    })
    void testUrgencyDetection(String input, TaskPriority expectedPriority) {
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals(expectedPriority, task.priority, 
            "Priority should be correctly detected for: " + input);
        
        // Check that urgency is calculated
        assertNotNull(task.urgency, "Urgency should be calculated");
        assertTrue(task.urgency >= 0.0, "Urgency should be non-negative");
        
        // High priority tasks should have higher urgency
        if (expectedPriority == TaskPriority.HIGH) {
            assertTrue(task.urgency > 5.0, 
                "High priority tasks should have urgency > 5.0, got: " + task.urgency);
        }
    }
    
    @Test
    void testUrgencyCalculationWithTags() {
        Task task = parser.parseNaturalLanguage("Important urgent task needs attention");
        
        assertNotNull(task);
        assertNotNull(task.urgency);
        
        // Should detect both "important" and "urgent" keywords
        assertTrue(task.tags.contains("urgent") || task.tags.contains("important"), 
            "Should contain urgency-related tags");
        
        // Should have high priority
        assertEquals(TaskPriority.HIGH, task.priority);
        
        // Should have significant urgency score
        assertTrue(task.urgency > 8.0, 
            "Urgent + important should have high urgency score, got: " + task.urgency);
    }
    
    @Test
    void testUrgencyWithDueDate() {
        Task task = parser.parseNaturalLanguage("URGENT: Submit report due tomorrow");
        
        assertNotNull(task);
        assertNotNull(task.urgency);
        assertEquals(TaskPriority.HIGH, task.priority);
        
        // Should have due date parsed
        assertNotNull(task.dueDate, "Should parse due date");
        
        // Urgent task with due date should have very high urgency
        assertTrue(task.urgency > 10.0, 
            "Urgent task with due date should have very high urgency, got: " + task.urgency);
    }
}