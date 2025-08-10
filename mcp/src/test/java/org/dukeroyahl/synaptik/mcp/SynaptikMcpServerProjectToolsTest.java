package org.dukeroyahl.synaptik.mcp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import io.smallrye.mutiny.Uni;

import jakarta.ws.rs.core.Response;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;

class SynaptikMcpServerProjectToolsTest {

    SynaptikMcpServer server;
    SynaptikApiClient apiClient;

    @BeforeEach
    void setUp() {
        server = new SynaptikMcpServer();
        apiClient = Mockito.mock(SynaptikApiClient.class);
        server.apiClient = apiClient;
        server.init();
    }

    @Test
    void getAllProjectsFormatsList() {
        Project p = new Project();
        p.id = "123";
        p.name = "Test Project";
        p.status = ProjectStatus.STARTED;
        when(apiClient.getAllProjects()).thenReturn(Uni.createFrom().item(List.of(p)));

        String result = server.getAllProjects().await().indefinitely();
        assertTrue(result.contains("Test Project"));
        assertTrue(result.contains("123"));
    }

    @Test
    void startProjectSuccess() {
        Project p = new Project();
        p.id = "550e8400-e29b-41d4-a716-446655440000";
        p.name = "Test Project";
        p.status = ProjectStatus.STARTED;
        
        Response resp = Response.ok(p).build();
        when(apiClient.startProject("550e8400-e29b-41d4-a716-446655440000")).thenReturn(Uni.createFrom().item(resp));

        String result = server.activateProject("550e8400-e29b-41d4-a716-446655440000").await().indefinitely();
        assertTrue(result.contains("✅ Project started"));
        assertTrue(result.contains("Test Project"));
    }

    @Test
    void startProjectNotFound() {
        Response resp = Response.status(404).build();
        when(apiClient.startProject("550e8400-e29b-41d4-a716-446655440001")).thenReturn(Uni.createFrom().item(resp));

        String result = server.activateProject("550e8400-e29b-41d4-a716-446655440001").await().indefinitely();
        assertTrue(result.contains("❌ Failed to start project"));
    }

    @Test
    void completeProjectSuccess() {
        Project p = new Project();
        p.id = "550e8400-e29b-41d4-a716-446655440002";
        p.name = "Test Project";
        p.status = ProjectStatus.COMPLETED;
        
        Response resp = Response.ok(p).build();
        when(apiClient.completeProject("550e8400-e29b-41d4-a716-446655440002")).thenReturn(Uni.createFrom().item(resp));

        String result = server.completeProject("550e8400-e29b-41d4-a716-446655440002").await().indefinitely();
        assertTrue(result.contains("✅ Project completed"));
        assertTrue(result.contains("Test Project"));
    }
}
