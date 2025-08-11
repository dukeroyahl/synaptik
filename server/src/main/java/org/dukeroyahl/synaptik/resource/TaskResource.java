package org.dukeroyahl.synaptik.resource;

import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.dukeroyahl.synaptik.mapper.TaskMapper;
import org.dukeroyahl.synaptik.service.TaskService;
import org.dukeroyahl.synaptik.service.TaskGraphService;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Path("/api/tasks")
@Tag(name = "Tasks", description = "Task management operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {
    
    @Inject
    TaskService taskService;
    
    @Inject
    TaskGraphService taskGraphService;
    
    @Inject
    TaskMapper taskMapper;

    @GET
    @Operation(summary = "Get all tasks", description = "Retrieve all tasks with their project details")
    public Uni<List<TaskDTO>> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get task by ID", description = "Retrieve a specific task by its ID")
    public Uni<Response> getTaskById(@PathParam("id") String id) {
        try {
            UUID taskId = UUID.fromString(id);
            return taskService.getTaskById(taskId)
                .onItem().transform(task -> {
                    if (task != null) {
                        return Response.ok(task).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND).build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }
    }

    @POST
    @Operation(summary = "Create a new task", description = "Create a new task with the provided details")
    public Uni<Response> createTask(@Valid TaskRequest taskRequest) {
        return taskService.createTask(taskRequest)
            .onItem().transform(createdTask -> 
                Response.status(Response.Status.CREATED)
                    .entity(createdTask)
                    .build()
            );
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update a task", description = "Update an existing task with new details")
    public Uni<Response> updateTask(@PathParam("id") String id, @Valid TaskRequest taskRequest) {
        try {
            UUID taskId = UUID.fromString(id);
            taskRequest.id = taskId; // Set the ID from path parameter
            return taskService.updateTask(taskRequest)
                .onItem().transform(updatedTask -> {
                    if (updatedTask != null) {
                        return Response.ok(updatedTask).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND).build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete a task", description = "Delete a task by its ID")
    public Uni<Response> deleteTask(@PathParam("id") String id) {
        try {
            UUID taskId = UUID.fromString(id);
            return taskService.deleteTask(taskId)
                .onItem().transform(deleted -> {
                    if (deleted) {
                        return Response.noContent().build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND).build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }
    }

    @DELETE
    @Operation(summary = "Delete all tasks", description = "Delete all tasks from the system")
    public Uni<Response> deleteAllTasks() {
        return taskService.deleteAllTasks()
            .onItem().transform(count -> Response.noContent().build());
    }

    @PUT
    @Path("/{id}/status")
    @Operation(summary = "Update task status", description = "Update the status of a specific task")
    public Uni<Response> updateTaskStatus(@PathParam("id") String id, TaskStatus status) {
        try {
            UUID taskId = UUID.fromString(id);
            return taskService.updateTaskStatus(taskId, status)
                .onItem().transform(success -> {
                    if (success) {
                        return Response.ok().build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND).build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }
    }
    
    @GET
    @Path("/search")
    @Operation(summary = "Search tasks with multiple filters", 
               description = "Search tasks by status list, title (partial), assignee (partial), project UUID (exact), date range with timezone support")
    public Uni<List<TaskDTO>> searchTasks(
            @QueryParam("status") List<TaskStatus> statuses,
            @QueryParam("title") String title,
            @QueryParam("assignee") String assignee,
            @QueryParam("projectId") String projectId,
            @QueryParam("dateFrom") String dateFrom,
            @QueryParam("dateTo") String dateTo,
            @QueryParam("tz") @DefaultValue("UTC") String timezone) {
        
        return taskService.searchTasks(statuses, title, assignee, projectId, dateFrom, dateTo, timezone)
            .onItem().transform(taskMapper::toDTOList);
    }

    @GET
    @Path("/graph")
    @Operation(summary = "Get task dependency graph", description = "Retrieve task dependency graph with optional status filtering")
    public Uni<TaskGraphResponse> getTaskGraph(@QueryParam("statuses") String statuses) {
        // Parse statuses string to List<TaskStatus>
        List<TaskStatus> statusList = new ArrayList<>();
        if (statuses != null && !statuses.trim().isEmpty()) {
            String[] statusArray = statuses.split(",");
            for (String status : statusArray) {
                try {
                    statusList.add(TaskStatus.valueOf(status.trim().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Skip invalid statuses
                }
            }
        }
        
        return taskGraphService.buildTaskGraph(statusList);
    }

    @GET
    @Path("/{id}/neighbors")
    @Operation(summary = "Get task neighbors", description = "Get task dependencies and dependents")
    public Uni<Response> getTaskNeighbors(
            @PathParam("id") String taskId,
            @QueryParam("depth") @DefaultValue("1") String depth,
            @QueryParam("includePlaceholders") @DefaultValue("true") String includePlaceholders) {
        
        try {
            UUID taskUUID = UUID.fromString(taskId);
            int depthInt = Integer.parseInt(depth);
            boolean includePlaceholdersBool = Boolean.parseBoolean(includePlaceholders);
            
            return taskGraphService.buildNeighborsGraph(taskUUID, depthInt, includePlaceholdersBool)
                .onItem().transform(neighbors -> {
                    if (neighbors != null) {
                        return Response.ok(neighbors).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND).build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST).build());
        }
    }
}
