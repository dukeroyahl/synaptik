package org.dukeroyahl.synaptik.mcp;

import java.util.List;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
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
    @Path("/api/tasks/{id}")
    Uni<Response> getTask(@PathParam("id") String id);
    
    @POST
    @Path("/api/tasks")
    Uni<Response> createTask(Task task);
    
    @PUT
    @Path("/api/tasks/{id}")
    Uni<Response> updateTask(@PathParam("id") String id, Task updates);
    
    @DELETE
    @Path("/api/tasks/{id}")
    Uni<Response> deleteTask(@PathParam("id") String id);
    
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
    @Path("/api/tasks/started")
    Uni<List<Task>> getStartedTasks();
    
    @GET
    @Path("/api/tasks/completed")
    Uni<List<Task>> getCompletedTasks();
    
    @GET
    @Path("/api/tasks/overdue")
    Uni<List<Task>> getOverdueTasks();
    
    @GET
    @Path("/api/tasks/today")
    Uni<List<Task>> getTodayTasks();
    
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
    Uni<Response> updateProject(@PathParam("id") String id, Project updates);
    
    @DELETE
    @Path("/api/projects/{id}")
    Uni<Response> deleteProject(@PathParam("id") String id);
    
    @POST
    @Path("/api/projects/{id}/activate")
    Uni<Response> activateProject(@PathParam("id") String id);
    
    @POST
    @Path("/api/projects/{id}/complete")
    Uni<Response> completeProject(@PathParam("id") String id);
    
    @POST
    @Path("/api/projects/{id}/hold")
    Uni<Response> putProjectOnHold(@PathParam("id") String id);
    
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
