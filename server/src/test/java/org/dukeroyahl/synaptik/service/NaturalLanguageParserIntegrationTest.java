package org.dukeroyahl.synaptik.service;

import io.quarkus.test.junit.QuarkusTest;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class NaturalLanguageParserIntegrationTest {
    
    @Inject
    NaturalLanguageParser nlpParser;
    
    @Test
    public void testStanfordNLPServiceInjection() {
        assertNotNull(nlpParser, "NaturalLanguageParser should be injected");
        System.out.println("\n=== Stanford NLP Service Injection Test ===");
        System.out.println("✅ NaturalLanguageParser successfully injected");
        System.out.println("============================================\n");
    }
    
    @Test
    public void testParseNaturalLanguageMeeting() {
        String input = "Meet with Sarah tomorrow at 3pm about the project";
        Task task = nlpParser.parseNaturalLanguage(input);
        
        assertNotNull(task, "Task should not be null");
        assertNotNull(task.title, "Task title should not be null");
        assertEquals(TaskStatus.PENDING, task.status, "Task status should be PENDING");
        
        System.out.println("\n=== Natural Language Meeting Parsing Test ===");
        System.out.println("Input: " + input);
        System.out.println("Parsed Task:");
        System.out.println("  Title: " + task.title);
        System.out.println("  Assignee: " + task.assignee);
        System.out.println("  Due Date: " + task.dueDate);
        System.out.println("  Project: " + task.project);
        System.out.println("  Priority: " + task.priority);
        System.out.println("  Status: " + task.status);
        System.out.println("  Tags: " + task.tags);
        System.out.println("===============================================\n");
    }
    
    @Test
    public void testParseUrgentTask() {
        String input = "Send urgent email to client about proposal";
        Task task = nlpParser.parseNaturalLanguage(input);
        
        assertNotNull(task, "Task should not be null");
        assertEquals(TaskPriority.HIGH, task.priority, "Urgent task should have HIGH priority");
        assertTrue(task.tags.contains("urgent") || task.tags.contains("email") || task.tags.contains("send"), 
                  "Task should have relevant tags");
        
        System.out.println("\n=== Natural Language Urgent Task Parsing Test ===");
        System.out.println("Input: " + input);
        System.out.println("Parsed Task:");
        System.out.println("  Title: " + task.title);
        System.out.println("  Priority: " + task.priority);
        System.out.println("  Tags: " + task.tags);
        System.out.println("==================================================\n");
    }
    
    @Test
    public void testParseTaskWarriorSyntax() {
        String input = "Buy groceries due:tomorrow +shopping priority:H";
        Task task = nlpParser.parseNaturalLanguage(input);
        
        assertNotNull(task, "Task should not be null");
        assertEquals("Buy groceries", task.title, "TaskWarrior syntax should parse title correctly");
        assertEquals(TaskPriority.HIGH, task.priority, "Priority should be HIGH");
        assertTrue(task.tags.contains("shopping"), "Should contain shopping tag");
        assertNotNull(task.dueDate, "Due date should be set");
        
        System.out.println("\n=== TaskWarrior Syntax Compatibility Test ===");
        System.out.println("Input: " + input);
        System.out.println("Parsed Task:");
        System.out.println("  Title: " + task.title);
        System.out.println("  Priority: " + task.priority);
        System.out.println("  Due Date: " + task.dueDate);
        System.out.println("  Tags: " + task.tags);
        System.out.println("==============================================\n");
    }
    
    @Test
    public void testParseSimpleTask() {
        String input = "Write documentation";
        Task task = nlpParser.parseNaturalLanguage(input);
        
        assertNotNull(task, "Task should not be null");
        assertTrue(task.title.contains("Write") || task.title.contains("documentation"), 
                  "Title should contain key words");
        assertEquals(TaskStatus.PENDING, task.status, "Status should be PENDING");
        
        System.out.println("\n=== Simple Task Parsing Test ===");
        System.out.println("Input: " + input);
        System.out.println("Parsed Task:");
        System.out.println("  Title: " + task.title);
        System.out.println("  Status: " + task.status);
        System.out.println("  Priority: " + task.priority);
        System.out.println("  Tags: " + task.tags);
        System.out.println("=================================\n");
    }
    
    @Test
    public void testParseCriticalTask() {
        String input = "Fix critical bug in login system";
        Task task = nlpParser.parseNaturalLanguage(input);
        
        assertNotNull(task, "Task should not be null");
        assertEquals(TaskPriority.HIGH, task.priority, "Critical task should have HIGH priority");
        
        System.out.println("\n=== Critical Task Parsing Test ===");
        System.out.println("Input: " + input);
        System.out.println("Parsed Task:");
        System.out.println("  Title: " + task.title);
        System.out.println("  Priority: " + task.priority);
        System.out.println("  Tags: " + task.tags);
        System.out.println("===================================\n");
    }
}
