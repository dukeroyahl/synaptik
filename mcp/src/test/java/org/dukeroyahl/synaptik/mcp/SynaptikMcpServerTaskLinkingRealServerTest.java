package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class SynaptikMcpServerTaskLinkingRealServerTest {

    @Inject
    SynaptikMcpServer mcpServer;

    @Test
    void testLinkTasks_ValidationErrors() {
        // Test empty task ID
        Uni<String> result1 = mcpServer.linkTasks("", "task2");
        String response1 = result1.await().indefinitely();
        assertEquals("❌ Task ID is required", response1);

        // Test empty dependencies
        Uni<String> result2 = mcpServer.linkTasks("task1", "");
        String response2 = result2.await().indefinitely();
        assertEquals("❌ At least one dependency task ID is required", response2);

        // Test null task ID
        Uni<String> result3 = mcpServer.linkTasks(null, "task2");
        String response3 = result3.await().indefinitely();
        assertEquals("❌ Task ID is required", response3);

        // Test null dependencies
        Uni<String> result4 = mcpServer.linkTasks("task1", null);
        String response4 = result4.await().indefinitely();
        assertEquals("❌ At least one dependency task ID is required", response4);
    }

    @Test
    void testUnlinkTasks_ValidationErrors() {
        // Test empty task ID
        Uni<String> result1 = mcpServer.unlinkTasks("", "task2");
        String response1 = result1.await().indefinitely();
        assertEquals("❌ Task ID is required", response1);

        // Test null task ID
        Uni<String> result2 = mcpServer.unlinkTasks(null, "task2");
        String response2 = result2.await().indefinitely();
        assertEquals("❌ Task ID is required", response2);
    }

    @Test
    void testGetTaskDependencies_ValidationErrors() {
        // Test empty task ID
        Uni<String> result1 = mcpServer.getTaskDependencies("");
        String response1 = result1.await().indefinitely();
        assertEquals("❌ Task ID is required", response1);

        // Test null task ID
        Uni<String> result2 = mcpServer.getTaskDependencies(null);
        String response2 = result2.await().indefinitely();
        assertEquals("❌ Task ID is required", response2);
    }

    @Test
    void testGetTaskDependents_ValidationErrors() {
        // Test empty task ID
        Uni<String> result1 = mcpServer.getTaskDependents("");
        String response1 = result1.await().indefinitely();
        assertEquals("❌ Task ID is required", response1);

        // Test null task ID
        Uni<String> result2 = mcpServer.getTaskDependents(null);
        String response2 = result2.await().indefinitely();
        assertEquals("❌ Task ID is required", response2);
    }

    @Test
    @Disabled("Requires real server connection - enable for integration testing")
    void testLinkTasks_WithRealServer() {
        // This test would require the real Synaptik server to be running
        // and would create actual tasks to test linking functionality
        
        // For now, we'll just test that the method doesn't crash with invalid IDs
        Uni<String> result = mcpServer.linkTasks("invalid-id", "another-invalid-id");
        String response = result.await().indefinitely();
        
        // Should contain some kind of response (either success or error)
        assertNotNull(response);
        assertTrue(response.length() > 0);
    }

    @Test
    @Disabled("Requires real server connection - enable for integration testing")
    void testGetTaskDependencies_WithRealServer() {
        // This test would require the real Synaptik server to be running
        
        // For now, we'll just test that the method doesn't crash with invalid IDs
        Uni<String> result = mcpServer.getTaskDependencies("invalid-id");
        String response = result.await().indefinitely();
        
        // Should contain some kind of response (either success or error)
        assertNotNull(response);
        assertTrue(response.length() > 0);
    }
}
