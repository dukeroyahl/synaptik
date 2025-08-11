package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify project information is displayed correctly in task responses
 */
@QuarkusTest
class SynaptikMcpServerProjectDisplayTest {

    @Inject
    SynaptikMcpServer server;

    @Test
    void testCreateTaskWithProjectShowsProjectInfo() {
        String result = server.createTask(
            "Test Project Display Task",
            "Testing that project information is displayed correctly",
            "MEDIUM",
            "Platform Integration",  // This should be converted to projectId
            "Test User",
            "2025-12-31T23:59:59Z",
            "test,project-display"
        ).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("✅ Task created successfully"));
        assertTrue(result.contains("Test Project Display Task"));
        
        // Should show either project name or project ID
        boolean hasProjectInfo = result.contains("Project: Platform Integration") || 
                                result.contains("Project ID:");
        assertTrue(hasProjectInfo, "Task should display project information. Actual result: " + result);
        
        System.out.println("Task creation result:");
        System.out.println(result);
    }
}
