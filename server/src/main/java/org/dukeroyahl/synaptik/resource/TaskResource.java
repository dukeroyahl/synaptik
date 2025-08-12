package org.dukeroyahl.synaptik.resource;

import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.Task;
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
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.io.IOException;
import java.nio.file.Files;
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
    ObjectMapper objectMapper;
    
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
    @Consumes(MediaType.APPLICATION_JSON)
    @Operation(summary = "Update task status", description = "Update the status of a specific task")
    public Uni<Boolean> updateTaskStatus(@PathParam("id") String id, TaskStatus status) {
        try {
            UUID taskId = UUID.fromString(id);
            return taskService.updateTaskStatus(taskId, status)
                .onItem().transform(success -> {
                    return success;
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(false);
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
        
        return taskService.searchTasks(statuses, title, assignee, projectId, dateFrom, dateTo, timezone);
    }

    @GET
    @Path("/overdue")
    @Operation(summary = "Get overdue tasks", 
               description = "Retrieve tasks that are past their due date in the specified timezone")
    public Uni<List<TaskDTO>> getOverdueTasks(
            @QueryParam("tz") @DefaultValue("UTC") String timezone) {
        
        return taskService.getOverdueTasks(timezone);
    }

    @GET
    @Path("/today")
    @Operation(summary = "Get tasks due today", 
               description = "Retrieve tasks that are due today in the specified timezone")
    public Uni<List<TaskDTO>> getDueTodayTasks(
            @QueryParam("tz") @DefaultValue("UTC") String timezone) {
        
        return taskService.getDueTodayTasks(timezone);
    }

    @GET
    @Path("/pending")
    @Operation(summary = "Get pending tasks", 
               description = "Retrieve all tasks with PENDING status")
    public Uni<List<TaskDTO>> getPendingTasks() {
        return taskService.searchTasks(List.of(TaskStatus.PENDING), null, null, null, null, null, "UTC");
    }
    @GET
    @Path("/completed")
    @Operation(summary = "Get completed tasks", 
               description = "Retrieve all tasks with COMPLETED status")
    public Uni<List<TaskDTO>> getCompletedTasks() {
        return taskService.searchTasks(List.of(TaskStatus.COMPLETED), null, null, null, null, null, "UTC");
    }

    @GET
    @Path("/export")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Export all tasks", 
               description = "Export all tasks as JSON with complete data retention")
    public Uni<List<TaskDTO>> exportTasks() {
        return taskService.getAllTasks();
    }

    @GET
    @Path("/export/csv")
    @Produces("text/csv")
    @Operation(summary = "Export all tasks as CSV", 
               description = "Export all tasks as CSV file for spreadsheet applications")
    public Uni<Response> exportTasksAsCsv() {
        return taskService.exportTasksAsCsv()
            .onItem().transform(csvContent -> 
                Response.ok(csvContent)
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=\"tasks-export.csv\"")
                    .build()
            );
    }

    @POST
    @Path("/import")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Operation(summary = "Import tasks from file", 
               description = "Import tasks from uploaded JSON file containing Task entities array")
    public Uni<Response> importTasksFromFile(@RestForm("file") FileUpload file) {
        if (file == null) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"No file uploaded\"}")
                    .build()
            );
        }

        return Uni.createFrom().item(() -> {
            try {
                // Read file content
                byte[] fileContent = Files.readAllBytes(file.uploadedFile());
                String jsonContent = new String(fileContent);
                
                // Parse JSON array of Task entities
                List<Task> tasks = objectMapper.readValue(jsonContent, new TypeReference<List<Task>>() {});
                
                return tasks;
            } catch (IOException e) {
                throw new RuntimeException("Failed to parse uploaded file: " + e.getMessage(), e);
            }
        })
        .onItem().transformToUni(tasks -> taskService.importTasks(tasks))
        .onItem().transform(importedCount -> 
            Response.ok()
                .entity("{\"message\": \"Successfully imported " + importedCount + " tasks\"}")
                .build()
        )
        .onFailure().recoverWithItem(throwable -> 
            Response.status(Response.Status.BAD_REQUEST)
                .entity("{\"error\": \"Import failed: " + throwable.getMessage() + "\"}")
                .build()
        );
    }
    @GET
    @Path("/active")
    @Operation(summary = "Get active tasks", 
               description = "Retrieve all tasks with ACTIVE status")
    public Uni<List<TaskDTO>> getActiveTasks() {
        return taskService.searchTasks(List.of(TaskStatus.ACTIVE), null, null, null, null, null, "UTC");
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

    @POST
    @Path("/{id}/link/{dependencyId}")
    @Operation(summary = "Link tasks", 
               description = "Create a dependency link from one task to another. The task with {id} will depend on the task with {dependencyId}")
    public Uni<Response> linkTasks(@PathParam("id") String id, @PathParam("dependencyId") String dependencyId) {
        try {
            UUID taskId = UUID.fromString(id);
            UUID depId = UUID.fromString(dependencyId);
            
            return taskService.linkTasks(taskId, depId)
                .onItem().transform(success -> {
                    if (success) {
                        return Response.ok()
                            .entity("{\"message\": \"Tasks linked successfully\"}")
                            .build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity("{\"error\": \"One or both tasks not found\"}")
                            .build();
                    }
                })
                .onFailure().recoverWithItem(throwable -> 
                    Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Failed to link tasks: " + throwable.getMessage() + "\"}")
                        .build()
                );
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid task ID format\"}")
                    .build()
            );
        }
    }

    @DELETE
    @Path("/{id}/link/{dependencyId}")
    @Operation(summary = "Unlink tasks", 
               description = "Remove a dependency link between tasks. The task with {id} will no longer depend on the task with {dependencyId}")
    public Uni<Response> unlinkTasks(@PathParam("id") String id, @PathParam("dependencyId") String dependencyId) {
        try {
            UUID taskId = UUID.fromString(id);
            UUID depId = UUID.fromString(dependencyId);
            
            return taskService.unlinkTasks(taskId, depId)
                .onItem().transform(success -> {
                    if (success) {
                        return Response.ok()
                            .entity("{\"message\": \"Tasks unlinked successfully\"}")
                            .build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity("{\"error\": \"Link not found or tasks don't exist\"}")
                            .build();
                    }
                })
                .onFailure().recoverWithItem(throwable -> 
                    Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\": \"Failed to unlink tasks: " + throwable.getMessage() + "\"}")
                        .build()
                );
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid task ID format\"}")
                    .build()
            );
        }
    }

    @GET
    @Path("/{id}/dependencies")
    @Operation(summary = "Get task dependencies", 
               description = "Get all tasks that this task depends on")
    public Uni<Response> getTaskDependencies(@PathParam("id") String id) {
        try {
            UUID taskId = UUID.fromString(id);
            
            return taskService.getTaskDependencies(taskId)
                .onItem().transform(dependencies -> {
                    if (dependencies != null) {
                        return Response.ok(dependencies).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity("{\"error\": \"Task not found\"}")
                            .build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid task ID format\"}")
                    .build()
            );
        }
    }

    @GET
    @Path("/{id}/dependents")
    @Operation(summary = "Get task dependents", 
               description = "Get all tasks that depend on this task")
    public Uni<Response> getTaskDependents(@PathParam("id") String id) {
        try {
            UUID taskId = UUID.fromString(id);
            
            return taskService.getTaskDependents(taskId)
                .onItem().transform(dependents -> {
                    if (dependents != null) {
                        return Response.ok(dependents).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity("{\"error\": \"Task not found\"}")
                            .build();
                    }
                });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Invalid task ID format\"}")
                    .build()
            );
        }
    }
}
