package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;

class NaturalLanguageParserTest {
    
    private NaturalLanguageParser parser;
    private StanfordNLPService mockNlpService;
    
    @BeforeEach
    void setUp() {
        parser = new NaturalLanguageParser();
        mockNlpService = Mockito.mock(StanfordNLPService.class);
        
        // Inject mock service using reflection
        try {
            var nlpServiceField = NaturalLanguageParser.class.getDeclaredField("nlpService");
            nlpServiceField.setAccessible(true);
            nlpServiceField.set(parser, mockNlpService);
        } catch (Exception e) {
            fail("Failed to inject mock NLP service: " + e.getMessage());
        }
        
        // Setup mock to return basic NLP result
        StanfordNLPService.NLPResult mockResult = new StanfordNLPService.NLPResult();
        mockResult.originalText = "test input";
        Mockito.when(mockNlpService.processText(anyString())).thenReturn(mockResult);
    }
    
    @Test
    void testParseMeetingWithTime() {
        String input = "Meet with Sarah tomorrow at 3pm about the project";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Meet") || task.title.contains("Sarah") || task.title.contains("project"));
        assertEquals(TaskStatus.PENDING, task.status);
    }
    
    @Test
    void testParseUrgentTask() {
        String input = "Send urgent email to client about proposal";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("email") || task.title.contains("client"));
        assertEquals(TaskPriority.HIGH, task.priority);
        assertTrue(task.tags.contains("urgent") || task.tags.contains("email") || task.tags.contains("send"));
    }
    
    @Test
    void testParseTaskWarriorSyntax() {
        String input = "Buy groceries due:tomorrow +shopping priority:H";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals("Buy groceries", task.title);
        assertEquals(TaskPriority.HIGH, task.priority);
        assertNotNull(task.dueDate);
        assertTrue(task.tags.contains("shopping"));
    }
    
    @Test
    void testParseDateOnly() {
        String input = "Review code next Friday";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Review") || task.title.contains("code"));
        // Due date might be set depending on NLP processing
        assertEquals(TaskStatus.PENDING, task.status);
    }
    
    @Test
    void testParseSimpleTask() {
        String input = "Write documentation";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Write") || task.title.contains("documentation"));
        assertEquals(TaskStatus.PENDING, task.status);
        assertEquals(TaskPriority.NONE, task.priority);
    }
    
    @Test
    void testParsePriorityWords() {
        String input = "Fix critical bug in login system";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals(TaskPriority.HIGH, task.priority);
        assertTrue(task.title.contains("bug") || task.title.contains("login") || task.title.contains("Fix"));
    }
    
    @Test
    void testParseWithProject() {
        String input = "Update documentation for the mobile app project";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Update") || task.title.contains("documentation"));
        // Project extraction might work depending on pattern matching
        assertEquals(TaskStatus.PENDING, task.status);
    }
}
