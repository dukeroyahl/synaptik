package org.dukeroyahl.synaptik.mcp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import io.smallrye.mutiny.Uni;

import jakarta.ws.rs.core.Response;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.dto.TaskGraphNode;
import org.dukeroyahl.synaptik.dto.TaskGraphEdge;
import org.dukeroyahl.synaptik.domain.TaskStatus;

class SynaptikMcpServerGraphToolsTest {

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
    void getTaskGraphSuccess() {
        TaskGraphNode node = new TaskGraphNode("123", "Test Task", TaskStatus.ACTIVE, 
                                             "Project", "User", "HIGH", 5.0, false);
        TaskGraphEdge edge = new TaskGraphEdge("123", "456");
        TaskGraphResponse graph = new TaskGraphResponse("123", List.of(node), List.of(edge), false);
        
        when(apiClient.getTaskGraph("ACTIVE")).thenReturn(Uni.createFrom().item(graph));

        String result = server.getTaskGraph("ACTIVE").await().indefinitely();
        assertTrue(result.contains("Task Dependency Graph"));
        assertTrue(result.contains("Test Task"));
        assertTrue(result.contains("Nodes: 1"));
        assertTrue(result.contains("Edges: 1"));
        assertTrue(result.contains("Has Cycles: No"));
    }

    @Test
    void getTaskGraphEmpty() {
        TaskGraphResponse graph = new TaskGraphResponse(null, List.of(), List.of(), false);
        when(apiClient.getTaskGraph(null)).thenReturn(Uni.createFrom().item(graph));

        String result = server.getTaskGraph(null).await().indefinitely();
        assertTrue(result.contains("Task Dependency Graph"));
        assertTrue(result.contains("Nodes: 0"));
        assertTrue(result.contains("Edges: 0"));
    }

    @Test
    void getTaskNeighborsSuccess() {
        Response resp = Response.ok("graph data").build();
        when(apiClient.getTaskNeighbors("123", 1, true)).thenReturn(Uni.createFrom().item(resp));

        String result = server.getTaskNeighbors("123", "1", "true").await().indefinitely();
        assertTrue(result.contains("Task neighbors retrieved successfully"));
        assertTrue(result.contains("123"));
        assertTrue(result.contains("Depth: 1"));
        assertTrue(result.contains("Include placeholders: true"));
    }

    @Test
    void getTaskNeighborsInvalidDepth() {
        String result = server.getTaskNeighbors("123", "invalid", "true").await().indefinitely();
        assertTrue(result.contains("Invalid depth value"));
    }

    @Test
    void getTaskNeighborsInvalidPlaceholders() {
        // Boolean.parseBoolean doesn't throw exceptions, it just returns false for invalid values
        // So this test should verify that the method handles the parameter correctly
        Response resp = Response.ok("graph data").build();
        when(apiClient.getTaskNeighbors("123", 1, false)).thenReturn(Uni.createFrom().item(resp));
        
        String result = server.getTaskNeighbors("123", "1", "invalid").await().indefinitely();
        assertTrue(result.contains("Task neighbors retrieved successfully"));
        assertTrue(result.contains("Include placeholders: false"));
    }
}
