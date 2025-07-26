package com.synaptik.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.util.Map;

@Path("/health")
@Tag(name = "Health", description = "Health check operations")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {

    @GET
    @Operation(summary = "Health check endpoint")
    public Map<String, Object> health() {
        return Map.of(
            "status", "OK",
            "timestamp", LocalDateTime.now().toString(),
            "service", "synaptik-api",
            "message", "🧠 Where Ideas Connect"
        );
    }
}