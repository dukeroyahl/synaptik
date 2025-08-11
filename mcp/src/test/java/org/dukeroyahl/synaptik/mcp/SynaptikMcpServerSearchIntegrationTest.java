package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the new search functionality
 * These tests require the Synaptik backend to be running on port 8060
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SynaptikMcpServerSearchIntegrationTest {

    @Inject
    SynaptikMcpServer server;

    @Test
    @Order(1)
    void testSearchTasksBasic() {
        String result = server.searchTasks(null, null, null, null, null, null, null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        System.out.println("✅ Basic search works");
    }

    @Test
    @Order(2)
    void testSearchTasksByStatus() {
        String result = server.searchTasks(null, null, null, null, "PENDING,ACTIVE", null, null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("📊 Status: PENDING,ACTIVE"));
        System.out.println("✅ Search by status works");
    }

    @Test
    @Order(3)
    void testSearchTasksByTitle() {
        String result = server.searchTasks(null, null, null, null, null, "test", null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("📝 Title: test"));
        System.out.println("✅ Search by title works");
    }

    @Test
    @Order(4)
    void testSearchTasksByAssignee() {
        String result = server.searchTasks("john", null, null, null, null, null, null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("👤 Assignee: john"));
        System.out.println("✅ Search by assignee works");
    }

    @Test
    @Order(5)
    void testSearchTasksWithDateRange() {
        String result = server.searchTasks(null, "2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z", null, null, null, null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("📅 From: 2024-01-01T00:00:00Z"));
        assertTrue(result.contains("📅 To: 2024-12-31T23:59:59Z"));
        System.out.println("✅ Search with date range works");
    }

    @Test
    @Order(6)
    void testSearchTasksWithInvalidProjectId() {
        String result = server.searchTasks(null, null, null, "invalid-uuid", null, null, null).await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("❌ Invalid project ID format"));
        System.out.println("✅ Invalid project ID validation works");
    }

    @Test
    @Order(7)
    void testSearchTasksWithTimezone() {
        String result = server.searchTasks(null, null, null, null, null, null, "America/New_York").await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("🌍 Timezone: America/New_York"));
        System.out.println("✅ Search with custom timezone works");
    }

    @Test
    @Order(8)
    void testSearchTasksMultipleFilters() {
        String result = server.searchTasks("test", null, null, null, "PENDING", "integration", "UTC").await().indefinitely();
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("👤 Assignee: test"));
        assertTrue(result.contains("📊 Status: PENDING"));
        assertTrue(result.contains("📝 Title: integration"));
        assertTrue(result.contains("🌍 Timezone: UTC"));
        System.out.println("✅ Search with multiple filters works");
    }
}
