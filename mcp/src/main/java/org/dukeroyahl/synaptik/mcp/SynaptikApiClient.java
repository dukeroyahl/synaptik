package org.dukeroyahl.synaptik.mcp;

import java.util.List;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.dto.TaskCreateRequest;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;

/**
 * REST client interface for Synaptik API
 */
@Path("/api")
@RegisterRestClient(configKey = "synaptik-api")
public interface SynaptikApiClient {
    
    @GET
    @Path("/tasks")
    Uni<List<Task>> getTasks(
            @QueryParam("status") String status,
            @QueryParam("priority") String priority,
            @QueryParam("project") String project,
            @QueryParam("assignee") String assignee,
            @QueryParam("tags") String tags,
            @QueryParam("dueBefore") String dueBefore,
            @QueryParam("dueAfter") String dueAfter,
            @QueryParam("limit") Integer limit,
            @QueryParam("sortBy") String sortBy,
            @QueryParam("sortOrder") String sortOrder);

    @GET
    @Path("/tasks/{id}")
    Uni<Task> getTask(@PathParam("id") String id);

    @POST
    @Path("/tasks")
    Uni<Task> createTask(TaskCreateRequest request);

    @PUT
    @Path("/tasks/{id}/done")
    Uni<Task> markTaskDone(@PathParam("id") String id);

    @PUT
    @Path("/tasks/{id}/start")
    Uni<Task> startTask(@PathParam("id") String id);

    @GET
    @Path("/tasks/status/{status}")
    Uni<List<Task>> getTasksByStatus(@PathParam("status") String status);

    @GET
    @Path("/dashboard")
    Uni<Object> getDashboard();
}