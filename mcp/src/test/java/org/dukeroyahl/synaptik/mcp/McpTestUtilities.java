package org.dukeroyahl.synaptik.mcp;

import java.util.Arrays;
import org.mockito.Mockito;
import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.core.Response;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Common test utilities for MCP tests to reduce duplication
 */
class McpTestUtilities {
    
    /**
     * Set up a mock MCP server with API client
     */
    static MockServerSetup setupMockServer() {
        SynaptikMcpServer server = new SynaptikMcpServer();
        SynaptikApiClient apiClient = Mockito.mock(SynaptikApiClient.class);
        
        // Direct package access (same package as SynaptikMcpServer)
        server.apiClient = apiClient;
        server.init();
        
        return new MockServerSetup(server, apiClient);
    }
    
    /**
     * Create a successful Response with the given entity
     */
    static <T> Response createSuccessResponse(T entity) {
        return Response.ok(entity).build();
    }
    
    /**
     * Create a not found (404) Response
     */
    static Response createNotFoundResponse() {
        return Response.status(404).build();
    }
    
    /**
     * Assert that a result contains all expected priority icons
     */
    static void assertAllPriorityIcons(String result) {
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_HIGH_PRIORITY), "Missing HIGH priority icon");
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_MEDIUM_PRIORITY), "Missing MEDIUM priority icon");
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_LOW_PRIORITY), "Missing LOW priority icon");
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_NO_PRIORITY), "Missing NONE priority icon");
    }
    
    /**
     * Assert that a result contains all expected status icons
     */
    static void assertAllStatusIcons(String result) {
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_PENDING), "Missing PENDING status icon");
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_ACTIVE), "Missing ACTIVE status icon");
        assertTrue(result.contains(McpTestDataBuilder.Constants.ICON_COMPLETED), "Missing COMPLETED status icon");
    }
    
    /**
     * Assert that a result contains timezone information
     */
    static void assertContainsTimezone(String result) {
        assertTrue(result.contains("timezone:"), "Result should contain timezone information");
    }
    
    /**
     * Assert that a result handles null values gracefully (no "null" text)
     */
    static void assertNoNullValues(String result) {
        assertFalse(result.contains("null"), "Result should not contain 'null' text");
    }
    
    /**
     * Mock API client to return empty list for all collection methods
     */
    static void mockEmptyCollections(SynaptikApiClient apiClient) {
        when(apiClient.getAllTasks()).thenReturn(Uni.createFrom().item(java.util.List.of()));
        // Mock search-based task retrieval methods (replacing old status-specific endpoints)
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("PENDING")), eq(null), eq(null)))
                .thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("ACTIVE")), eq(null), eq(null)))
                .thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.searchTasks(eq(null), eq(null), eq(null), eq(null), eq(Arrays.asList("COMPLETED")), eq(null), eq(null)))
                .thenReturn(Uni.createFrom().item(java.util.List.of()));
        
        // Mock restored endpoints
        when(apiClient.getOverdueTasks(anyString())).thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.getTodayTasks(anyString())).thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.getAllProjects()).thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.getActiveProjects()).thenReturn(Uni.createFrom().item(java.util.List.of()));
        when(apiClient.getOverdueProjects()).thenReturn(Uni.createFrom().item(java.util.List.of()));
    }
    
    /**
     * Record to hold mock server setup
     */
    static record MockServerSetup(SynaptikMcpServer server, SynaptikApiClient apiClient) {}
}