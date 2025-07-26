package org.dukeroyahl.synaptik.resource;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.service.TaskService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/tasks")
@Tag(name = "Tasks", description = "Task management operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {
    
    @Inject
    TaskService taskService;
    
    @GET
    @Operation(summary = "Get all tasks")
    public Uni<List<Task>> getAllTasks() {
        return taskService.getAllTasks();
    }
    
    @GET
    @Path("/{id}")
    @Operation(summary = "Get task by ID")
    public Uni<Response> getTask(@PathParam("id") String id) {
        return taskService.getTaskById(new ObjectId(id))
            .onItem().ifNotNull().transform(task -> Response.ok(task).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Operation(summary = "Create a new task")
    public Uni<Response> createTask(@Valid Task task) {
        return taskService.createTask(task)
            .onItem().transform(createdTask -> Response.status(Response.Status.CREATED).entity(createdTask).build());
    }
    
    @PUT
    @Path("/{id}")
    @Operation(summary = "Update a task")
    public Uni<Response> updateTask(@PathParam("id") String id, @Valid Task updates) {
        return taskService.updateTask(new ObjectId(id), updates)
            .onItem().ifNotNull().transform(task -> Response.ok(task).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete a task")
    public Uni<Response> deleteTask(@PathParam("id") String id) {
        return taskService.deleteTask(new ObjectId(id))
            .onItem().transform(deleted -> deleted ? 
                Response.noContent().build() : 
                Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/start")
    @Operation(summary = "Start a task")
    public Uni<Response> startTask(@PathParam("id") String id) {
        return taskService.startTask(new ObjectId(id))
            .onItem().ifNotNull().transform(task -> Response.ok(task).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/stop")
    @Operation(summary = "Stop a task")
    public Uni<Response> stopTask(@PathParam("id") String id) {
        return taskService.stopTask(new ObjectId(id))
            .onItem().ifNotNull().transform(task -> Response.ok(task).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/done")
    @Operation(summary = "Mark task as done")
    public Uni<Response> markTaskDone(@PathParam("id") String id) {
        return taskService.markTaskDone(new ObjectId(id))
            .onItem().ifNotNull().transform(task -> Response.ok(task).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @GET
    @Path("/pending")
    @Operation(summary = "Get pending tasks")
    public Uni<List<Task>> getPendingTasks() {
        return taskService.getTasksByStatus(TaskStatus.PENDING);
    }
    
    @GET
    @Path("/active")
    @Operation(summary = "Get active tasks")
    public Uni<List<Task>> getActiveTasks() {
        return taskService.getTasksByStatus(TaskStatus.ACTIVE);
    }
    
    @GET
    @Path("/completed")
    @Operation(summary = "Get completed tasks")
    public Uni<List<Task>> getCompletedTasks() {
        return taskService.getTasksByStatus(TaskStatus.COMPLETED);
    }
    
    @GET
    @Path("/overdue")
    @Operation(summary = "Get overdue tasks")
    public Uni<List<Task>> getOverdueTasks() {
        return taskService.getOverdueTasks();
    }
    
    @GET
    @Path("/today")
    @Operation(summary = "Get today's tasks")
    public Uni<List<Task>> getTodayTasks() {
        return taskService.getTodayTasks();
    }
}