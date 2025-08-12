package org.dukeroyahl.synaptik.mcp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import io.smallrye.mutiny.Uni;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;

/**
 * Unit tests for the search functionality using mocks
 */
class SynaptikMcpServerSearchTest {

    SynaptikMcpServer server;
    SynaptikApiClient apiClient;

    @BeforeEach
    void setUp() {
        server = new SynaptikMcpServer();
        apiClient = mock(SynaptikApiClient.class);
        server.apiClient = apiClient;
        server.init();
    }

    @Test
    void searchTasksBasic() {
        List<Task> mockTasks = Arrays.asList(createMockTask("1", "Test Task", TaskStatus.PENDING));
        when(apiClient.searchTasks(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), anyString()))
                .thenReturn(Uni.createFrom().item(mockTasks));

        String result = server.searchTasks(null, null, null, null, null, null, null).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("Test Task"));
        assertTrue(result.contains("⏳")); // Pending status icon
    }

    @Test
    void searchTasksByStatus() {
        List<Task> mockTasks = Arrays.asList(createMockTask("1", "Active Task", TaskStatus.ACTIVE));
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("ACTIVE")), eq(null), anyString()))
                .thenReturn(Uni.createFrom().item(mockTasks));

        String result = server.searchTasks(null, null, null, null, "ACTIVE", null, null).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("📊 Status: ACTIVE"));
        assertTrue(result.contains("Active Task"));
        assertTrue(result.contains("🔄")); // Active status icon
    }

    @Test
    void searchTasksMultipleStatuses() {
        List<Task> mockTasks = Arrays.asList(
                createMockTask("1", "Pending Task", TaskStatus.PENDING),
                createMockTask("2", "Active Task", TaskStatus.ACTIVE)
        );
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("PENDING", "ACTIVE")), eq(null), anyString()))
                .thenReturn(Uni.createFrom().item(mockTasks));

        String result = server.searchTasks(null, null, null, null, "PENDING,ACTIVE", null, null).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("📊 Status: PENDING,ACTIVE"));
        assertTrue(result.contains("Pending Task"));
        assertTrue(result.contains("Active Task"));
    }

    @Test
    void searchTasksWithAllFilters() {
        List<Task> mockTasks = Arrays.asList(createMockTask("1", "Filtered Task", TaskStatus.COMPLETED));
        when(apiClient.searchTasks(eq("john"), eq("2024-01-01T00:00:00Z"), eq("2024-12-31T23:59:59Z"), 
                eq("550e8400-e29b-41d4-a716-446655440000"), eq(Arrays.asList("COMPLETED")), eq("test"), eq("UTC")))
                .thenReturn(Uni.createFrom().item(mockTasks));

        String result = server.searchTasks("john", "2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z", 
                "550e8400-e29b-41d4-a716-446655440000", "COMPLETED", "test", "UTC").await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("👤 Assignee: john"));
        assertTrue(result.contains("📝 Title: test"));
        assertTrue(result.contains("📊 Status: COMPLETED"));
        assertTrue(result.contains("📁 Project: 550e8400-e29b-41d4-a716-446655440000"));
        assertTrue(result.contains("📅 From: 2024-01-01T00:00:00Z"));
        assertTrue(result.contains("📅 To: 2024-12-31T23:59:59Z"));
        assertTrue(result.contains("🌍 Timezone: UTC"));
        assertTrue(result.contains("Filtered Task"));
    }

    @Test
    void searchTasksInvalidProjectId() {
        String result = server.searchTasks(null, null, null, "invalid-uuid", null, null, null).await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("❌ Invalid project ID format"));
    }

    @Test
    void searchTasksEmptyParameters() {
        List<Task> mockTasks = Arrays.asList(createMockTask("1", "All Tasks", TaskStatus.PENDING));
        when(apiClient.searchTasks(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), anyString()))
                .thenReturn(Uni.createFrom().item(mockTasks));

        String result = server.searchTasks("", "", "", "", "", "", "").await().indefinitely();
        
        assertNotNull(result);
        assertTrue(result.contains("🔍 Task search results"));
        assertTrue(result.contains("All Tasks"));
        // Should only show timezone in criteria since all other params are empty
        assertTrue(result.contains("🌍 Timezone:"));
    }

    private Task createMockTask(String id, String title, TaskStatus status) {
        Task task = new Task();
        task.id = id;
        task.title = title;
        task.status = status;
        return task;
    }
}
