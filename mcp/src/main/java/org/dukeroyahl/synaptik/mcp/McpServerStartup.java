package org.dukeroyahl.synaptik.mcp;

import java.util.logging.Logger;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;

/**
 * Startup event handler to ensure MCP server is properly initialized
 */
@ApplicationScoped
public class McpServerStartup {

    private static final Logger LOG = Logger.getLogger(McpServerStartup.class.getName());

    @Inject
    SynaptikMcpServer mcpServer;

    void onStart(@Observes StartupEvent ev) {
        LOG.info("=== MCP Server Startup Event ===");
        LOG.info("Forcing initialization of SynaptikMcpServer bean...");
        
        // Force bean initialization by accessing it
        if (mcpServer != null) {
            LOG.info("✅ SynaptikMcpServer bean successfully injected and initialized");
            
            // Trigger tool discovery logging
            try {
                java.lang.reflect.Method[] methods = mcpServer.getClass().getDeclaredMethods();
                int toolCount = 0;
                for (java.lang.reflect.Method method : methods) {
                    if (method.isAnnotationPresent(io.quarkiverse.mcp.server.Tool.class)) {
                        toolCount++;
                        io.quarkiverse.mcp.server.Tool toolAnnotation = method.getAnnotation(io.quarkiverse.mcp.server.Tool.class);
                        LOG.info("🔧 Found @Tool method: " + method.getName() + " - " + toolAnnotation.description());
                    }
                }
                LOG.info("📊 Total @Tool methods found: " + toolCount);
                
                if (toolCount == 0) {
                    LOG.warning("⚠️  No @Tool methods found! This explains why tools:{} is empty in capabilities");
                }
            } catch (Exception e) {
                LOG.severe("❌ Error during tool discovery: " + e.getMessage());
            }
        } else {
            LOG.severe("❌ Failed to inject SynaptikMcpServer bean");
        }
        
        LOG.info("=== MCP Server Startup Complete ===");
    }
}
