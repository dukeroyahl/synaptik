package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static org.junit.jupiter.api.Assertions.*;

class NaturalLanguageParserTest {
    
    private NaturalLanguageParser parser;
    
    @BeforeEach
    void setUp() {
        parser = new NaturalLanguageParser();
    }
    
    @Test
    void testParseMeetingWithTime() {
        String input = "Meet with Sarah tomorrow at 3pm about the project";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals("Meet with Sarah about the project", task.title);
        assertEquals("Sarah", task.assignee);
        assertEquals("the project", task.project);
        assertNotNull(task.dueDate);
        assertTrue(task.tags.contains("meeting"));
        assertEquals(TaskStatus.PENDING, task.status);
    }
    
    @Test
    void testParseUrgentTask() {
        String input = "Send urgent email to client about proposal";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Send") && task.title.contains("email"));
        assertEquals(TaskPriority.HIGH, task.priority);
        assertTrue(task.tags.contains("urgent"));
        assertTrue(task.tags.contains("email"));
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
        assertTrue(task.title.contains("Review code"));
        assertNotNull(task.dueDate);
        // Due date should be set to next Friday
        assertEquals(5, task.dueDate.getDayOfWeek().getValue()); // Friday = 5
    }
    
    @Test
    void testParseWithAssignee() {
        String input = "Call John about the marketing campaign";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Call") || task.assignee != null);
        // Should either extract John as assignee or include in title
    }
    
    @Test
    void testParseSimpleTask() {
        String input = "Write documentation";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals("Write documentation", task.title);
        assertEquals(TaskStatus.PENDING, task.status);
        assertEquals(TaskPriority.NONE, task.priority);
    }
    
    @Test
    void testParsePriorityWords() {
        String input = "Fix critical bug in login system";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertEquals(TaskPriority.HIGH, task.priority);
        assertTrue(task.title.contains("Fix") && task.title.contains("bug"));
    }
    
    @Test
    void testParseWithProject() {
        String input = "Update documentation for the mobile app project";
        Task task = parser.parseNaturalLanguage(input);
        
        assertNotNull(task);
        assertTrue(task.title.contains("Update documentation"));
        assertNotNull(task.project);
        assertTrue(task.project.contains("mobile app"));
    }
}
