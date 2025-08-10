package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests that test against the real Synaptik server
 * These tests require the Synaptik backend to be running on port 8060
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SynaptikMcpServerRealServerIntegrationTest {

    @Inject
    SynaptikMcpServer server;

    @Test
    @Order(1)
    void testGetAllTasks() {
        String result = server.getAllTasks().await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("All tasks"));
        System.out.println("✅ getAllTasks() works");
    }

    @Test
    @Order(2)
    void testGetPendingTasks() {
        String result = server.getPendingTasks().await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("Pending tasks"));
        System.out.println("✅ getPendingTasks() works");
    }

    @Test
    @Order(3)
    void testGetActiveTasks() {
        String result = server.getActiveTasks().await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("Active tasks"));
        System.out.println("✅ getActiveTasks() works");
    }

    @Test
    @Order(4)
    void testGetCompletedTasks() {
        String result = server.getCompletedTasks().await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("Completed tasks"));
        System.out.println("✅ getCompletedTasks() works");
    }

    @Test
    @Order(5)
    void testGetAllProjects() {
        String result = server.getAllProjects().await().indefinitely();
        assertNotNull(result);
        System.out.println("✅ getAllProjects() works");
    }

    @Test
    @Order(6)
    void testCreateTask() {
        String result = server.createTask(
            "Integration Test Task",
            "Testing task creation from integration test",
            "MEDIUM",
            "",
            "Test User",
            "2025-12-31T23:59:59Z",
            "integration-test"
        ).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("✅") || result.contains("Task created"));
        System.out.println("✅ createTask() works");
    }
}
