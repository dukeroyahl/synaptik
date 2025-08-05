package org.dukeroyahl.synaptik.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.dukeroyahl.synaptik.domain.Task;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ModelCentricTest {

    @Inject
    NaturalLanguageParser parser;

    @Test
    @DisplayName("Should detect location using semantic analysis instead of strict regex")
    public void testSemanticLocationDetection() {
        // Test case that was failing: "Lunch with Maria at Italian restaurant downtown"
        Task task = parser.parseNaturalLanguage("Lunch with Maria at Italian restaurant downtown");
        
        System.out.println("Parsed task: " + task.title);
        System.out.println("Assignee: " + task.assignee);
        System.out.println("Tags: " + task.tags);
        
        // Should detect "restaurant" location tag
        boolean hasRestaurantTag = task.tags.stream()
                .anyMatch(tag -> tag.contains("restaurant"));
        
        assertTrue(hasRestaurantTag, "Should have restaurant location tag");
        
        // Should detect Maria as assignee (not "with Maria")
        assertNotNull(task.assignee, "Should have assignee");
        assertEquals("Maria", task.assignee, "Assignee should be 'Maria', not 'with Maria'");
    }

    @Test
    @DisplayName("Should clean assignee extraction to avoid preposition contamination")
    public void testCleanAssigneeExtraction() {
        Task task = parser.parseNaturalLanguage("Conference call with team at building 42");
        
        System.out.println("Parsed task: " + task.title);
        System.out.println("Assignee: " + task.assignee);
        System.out.println("Tags: " + task.tags);
        
        // Should extract "team" not "with team"
        if (task.assignee != null) {
            assertFalse(task.assignee.startsWith("with "), 
                "Assignee should not start with preposition 'with'");
        }
        
        // Should have some location tag for building
        boolean hasLocationTag = task.tags.stream()
                .anyMatch(tag -> tag.startsWith("location:"));
        
        assertTrue(hasLocationTag, "Should have location tag for 'building 42'");
    }

    @Test
    @DisplayName("Should trust OpenNLP models over regex patterns")
    public void testModelTrustOverRegex() {
        Task task = parser.parseNaturalLanguage("Meeting with John at coffee shop");
        
        System.out.println("Parsed task: " + task.title);
        System.out.println("Assignee: " + task.assignee);
        System.out.println("Tags: " + task.tags);
        
        // OpenNLP should detect John as a person
        assertEquals("John", task.assignee, "Should detect John as assignee");
        
        // Should detect coffee shop as location
        boolean hasCoffeeShopTag = task.tags.stream()
                .anyMatch(tag -> tag.contains("coffee") || tag.contains("shop"));
        
        assertTrue(hasCoffeeShopTag, "Should detect coffee shop location");
    }
}
