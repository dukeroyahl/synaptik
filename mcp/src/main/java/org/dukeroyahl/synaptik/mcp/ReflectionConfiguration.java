package org.dukeroyahl.synaptik.mcp;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Register classes for reflection in native builds
 * This ensures MCP annotations are properly processed
 */
@RegisterForReflection(targets = {
    org.dukeroyahl.synaptik.mcp.SynaptikMcpServer.class,
    io.quarkiverse.mcp.server.Tool.class,
    io.quarkiverse.mcp.server.ToolArg.class
})
public class ReflectionConfiguration {
    // This class is used only for registration
}
