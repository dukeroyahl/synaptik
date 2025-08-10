package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests that call the real Synaptik API on port 8060
 * These tests require the Synaptik backend to be running
 */
@QuarkusTest
class SynaptikMcpServerIntegrationTest {

    @Inject
    SynaptikMcpServer server;

    @Test
    void testGetAllTasksInitially() {
        String result = server.getAllTasks().await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("All tasks"));
        // Should work even if empty
    }

    @Test
    void testGetAllProjectsInitially() {
        String result = server.getAllProjects().await().indefinitely();
        assertNotNull(result);
        // Should work even if empty
    }
}
