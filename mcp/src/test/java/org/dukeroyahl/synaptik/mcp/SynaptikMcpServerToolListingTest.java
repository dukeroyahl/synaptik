package org.dukeroyahl.synaptik.mcp;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SynaptikMcpServerToolListingTest {

    @Inject
    SynaptikMcpServer server;

    @Test
    void beanInjected() {
        assertNotNull(server, "SynaptikMcpServer should be injected");
    }

    @Test
    void toolsPresent() {
        long toolCount = java.util.Arrays.stream(SynaptikMcpServer.class.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(io.quarkiverse.mcp.server.Tool.class))
                .count();
        assertTrue(toolCount > 0, "Expected at least one @Tool annotated method");
    }
}
