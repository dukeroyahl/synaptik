package org.dukeroyahl.synaptik.mcp;

// Plain unit test (no @QuarkusTest) to avoid InjectMock
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import io.smallrye.mutiny.Uni;

import jakarta.ws.rs.core.Response;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;

class SynaptikMcpServerTaskToolsTest {

    SynaptikMcpServer server;
    SynaptikApiClient apiClient; // mock

    @BeforeEach
    void setUp() {
        server = new SynaptikMcpServer();
        apiClient = Mockito.mock(SynaptikApiClient.class);
        // direct package access (same package)
        server.apiClient = apiClient;
        server.init();
    }

    @Test
    void getAllTasksFormatsList() {
        Task t = new Task();
        t.id = "123";
        t.title = "Sample";
        t.status = TaskStatus.PENDING;
        when(apiClient.getAllTasks()).thenReturn(Uni.createFrom().item(List.of(t)));

        String result = server.getAllTasks().await().indefinitely();
        assertTrue(result.contains("Sample"));
        assertTrue(result.contains("123"));
    }

    @Test
    void getTaskNotFound() {
        Response resp = Response.status(404).build();
        when(apiClient.getTask("550e8400-e29b-41d4-a716-446655440000")).thenReturn(Uni.createFrom().item(resp));
        String result = server.getTask("550e8400-e29b-41d4-a716-446655440000").await().indefinitely();
        assertTrue(result.contains("❌ Task not found with ID:"));
    }

    @Test
    void getTaskFound() {
        Task t = new Task();
        t.id = "550e8400-e29b-41d4-a716-446655440001";
        t.title = "Test Task";
        t.status = TaskStatus.COMPLETED;
        Response resp = Response.ok(t).build();
        when(apiClient.getTask("550e8400-e29b-41d4-a716-446655440001")).thenReturn(Uni.createFrom().item(resp));
        String result = server.getTask("550e8400-e29b-41d4-a716-446655440001").await().indefinitely();
        assertTrue(result.contains("Test Task"));
        assertTrue(result.contains("Task retrieved successfully"));
        assertTrue(result.contains("✅")); // Status icon for completed task
    }

    @Test
    void getOverdueTasksWithTimezone() {
        Task t = new Task();
        t.id = "123";
        t.title = "Overdue Task";
        t.status = TaskStatus.PENDING;
        
        // Mock the API call with the system timezone
        String systemTimezone = java.time.ZoneId.systemDefault().getId();
        when(apiClient.getOverdueTasks(systemTimezone)).thenReturn(Uni.createFrom().item(List.of(t)));

        String result = server.getOverdueTasks().await().indefinitely();
        assertTrue(result.contains("Overdue Task"));
        assertTrue(result.contains("timezone: " + systemTimezone));
    }

    @Test
    void getTodayTasksWithTimezone() {
        Task t = new Task();
        t.id = "123";
        t.title = "Today Task";
        t.status = TaskStatus.PENDING;
        
        // Mock the API call with the system timezone
        String systemTimezone = java.time.ZoneId.systemDefault().getId();
        when(apiClient.getTodayTasks(systemTimezone)).thenReturn(Uni.createFrom().item(List.of(t)));

        String result = server.getTodayTasks().await().indefinitely();
        assertTrue(result.contains("Today Task"));
        assertTrue(result.contains("timezone: " + systemTimezone));
    }

    @Test
    void getActiveTasksSuccess() {
        Task t = new Task();
        t.id = "123";
        t.title = "Active Task";
        t.status = TaskStatus.ACTIVE;
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("ACTIVE")), eq(null), eq(null)))
                .thenReturn(Uni.createFrom().item(List.of(t)));

        String result = server.getActiveTasks().await().indefinitely();
        assertTrue(result.contains("Active Task"));
        assertTrue(result.contains("Active tasks"));
    }

    @Test
    void timezoneDetectionWorks() {
        // Verify that the system can detect timezone
        String systemTimezone = java.time.ZoneId.systemDefault().getId();
        assertNotNull(systemTimezone);
        assertFalse(systemTimezone.isEmpty());
        
        // Common timezone formats should be detected
        assertTrue(systemTimezone.contains("/") || systemTimezone.equals("UTC") || systemTimezone.startsWith("GMT"));
    }
}
