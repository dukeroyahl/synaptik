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
        p.status = ProjectStatus.ACTIVE;
        when(apiClient.getAllProjects()).thenReturn(Uni.createFrom().item(List.of(p)));

        String result = server.getAllProjects().await().indefinitely();
        assertTrue(result.contains("Test Project"));
        assertTrue(result.contains("123"));
    }

    @Test
    void startProjectSuccess() {
        Project p = new Project();
        p.id = "123";
        p.name = "Test Project";
        p.status = ProjectStatus.ACTIVE;
        
        Response resp = Response.ok(p).build();
        when(apiClient.startProject("123")).thenReturn(Uni.createFrom().item(resp));

        String result = server.activateProject("123").await().indefinitely();
        assertTrue(result.contains("started"));
        assertTrue(result.contains("Test Project"));
    }

    @Test
    void startProjectNotFound() {
        Response resp = Response.status(404).build();
        when(apiClient.startProject("nonexistent")).thenReturn(Uni.createFrom().item(resp));

        String result = server.activateProject("nonexistent").await().indefinitely();
        assertTrue(result.contains("Failed to start project"));
    }

    @Test
    void completeProjectSuccess() {
        Project p = new Project();
        p.id = "123";
        p.name = "Test Project";
        p.status = ProjectStatus.COMPLETED;
        
        Response resp = Response.ok(p).build();
        when(apiClient.completeProject("123")).thenReturn(Uni.createFrom().item(resp));

        String result = server.completeProject("123").await().indefinitely();
        assertTrue(result.contains("completed"));
        assertTrue(result.contains("Test Project"));
    }
}
