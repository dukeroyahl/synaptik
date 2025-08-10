package org.dukeroyahl.synaptik.mcp;

import java.util.List;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.dto.UpdateProject;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

/**
 * REST client interface for Synaptik API
 * Updated to match latest API definitions
 */
@RegisterRestClient(configKey = "synaptik-api")
public interface SynaptikApiClient {
    
    // ===== TASK ENDPOINTS =====
    
    @GET
    @Path("/api/tasks")
    Uni<List<Task>> getAllTasks();
    
    @GET
    @Path("/api/tasks/graph")
    Uni<TaskGraphResponse> getTaskGraph(@QueryParam("statuses") String statuses);
    
    @GET
    @Path("/api/tasks/{id}/neighbors")
    Uni<Response> getTaskNeighbors(@PathParam("id") String id, 
                                  @QueryParam("depth") int depth, 
                                  @QueryParam("includePlaceholders") boolean includePlaceholders);
    
    @GET
    @Path("/api/tasks/{id}")
    Uni<Response> getTask(@PathParam("id") String id);
    
    @POST
    @Path("/api/tasks")
    Uni<Response> createTask(TaskRequest taskRequest);
    
    @PUT
    @Path("/api/tasks/{id}")
    Uni<Response> updateTask(@PathParam("id") String id, TaskRequest taskRequest);
    
    @DELETE
    @Path("/api/tasks/{id}")
    Uni<Response> deleteTask(@PathParam("id") String id);
    
    @DELETE
    @Path("/api/tasks")
    Uni<Response> deleteAllTasks();
    
    @POST
    @Path("/api/tasks/{id}/start")
    Uni<Response> startTask(@PathParam("id") String id);
    
    @POST
    @Path("/api/tasks/{id}/stop")
    Uni<Response> stopTask(@PathParam("id") String id);
    
    @POST
    @Path("/api/tasks/{id}/done")
    Uni<Response> markTaskDone(@PathParam("id") String id);
    
    @GET
    @Path("/api/tasks/pending")
    Uni<List<Task>> getPendingTasks();
    
    @GET
    @Path("/api/tasks/active")
    Uni<List<Task>> getActiveTasks();
    
    @GET
    @Path("/api/tasks/completed")
    Uni<List<Task>> getCompletedTasks();
    
    @GET
    @Path("/api/tasks/overdue")
    Uni<List<Task>> getOverdueTasks(@QueryParam("tz") String timezone);
    
    @GET
    @Path("/api/tasks/today")
    Uni<List<Task>> getTodayTasks(@QueryParam("tz") String timezone);
    
    // ===== PROJECT ENDPOINTS =====
    
    @GET
    @Path("/api/projects")
    Uni<List<Project>> getAllProjects();
    
    @GET
    @Path("/api/projects/{id}")
    Uni<Response> getProject(@PathParam("id") String id);
    
    @POST
    @Path("/api/projects")
    Uni<Response> createProject(Project project);
    
    @PUT
    @Path("/api/projects/{id}")
    Uni<Response> updateProject(@PathParam("id") String id, org.dukeroyahl.synaptik.dto.UpdateProject updates);
    
    @DELETE
    @Path("/api/projects/{id}")
    Uni<Response> deleteProject(@PathParam("id") String id);
    
    @DELETE
    @Path("/api/projects")
    Uni<Response> deleteAllProjects();
    
    @PUT
    @Path("/api/projects/{id}/start")
    Uni<Response> startProject(@PathParam("id") String id);
    
    @PUT
    @Path("/api/projects/{id}/complete")
    Uni<Response> completeProject(@PathParam("id") String id);
    
    @PUT
    @Path("/api/projects/{id}/progress")
    Uni<Response> updateProjectProgress(@PathParam("id") String id, @QueryParam("progress") double progress);
    
    @GET
    @Path("/api/projects/status/{status}")
    Uni<List<Project>> getProjectsByStatus(@PathParam("status") ProjectStatus status);
    
    @GET
    @Path("/api/projects/owner/{owner}")
    Uni<List<Project>> getProjectsByOwner(@PathParam("owner") String owner);
    
    @GET
    @Path("/api/projects/overdue")
    Uni<List<Project>> getOverdueProjects();
    
    @GET
    @Path("/api/projects/active")
    Uni<List<Project>> getActiveProjects();
    
    @GET
    @Path("/api/projects/tag/{tag}")
    Uni<List<Project>> getProjectsByTag(@PathParam("tag") String tag);
    
}
