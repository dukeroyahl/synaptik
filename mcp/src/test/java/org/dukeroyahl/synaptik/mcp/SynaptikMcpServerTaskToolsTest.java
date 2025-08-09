package org.dukeroyahl.synaptik.mcp;

// Plain unit test (no @QuarkusTest) to avoid InjectMock
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import io.smallrye.mutiny.Uni;

import jakarta.ws.rs.core.Response;
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
        when(apiClient.getTask("nope")).thenReturn(Uni.createFrom().item(resp));
        String result = server.getTask("nope").await().indefinitely();
        assertTrue(result.contains("not found"));
    }

    @Test
    void getTaskFound() {
        Task t = new Task();
        t.id = "abc";
        t.title = "Test";
        t.status = TaskStatus.COMPLETED;
        Response resp = Response.ok(t).build();
        when(apiClient.getTask("abc")).thenReturn(Uni.createFrom().item(resp));
        String result = server.getTask("abc").await().indefinitely();
        assertTrue(result.contains("Test"));
        assertTrue(result.contains("✅"));
    }
}
