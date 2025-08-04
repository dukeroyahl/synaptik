package org.dukeroyahl.synaptik.mcp;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskCreateRequest;
import org.dukeroyahl.synaptik.dto.TaskUpdateRequest;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.RestClientBuilder;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;

/**
 * MCP service that calls Synaptik API via HTTP instead of direct database access.
 * Used for native MCP binary that connects to dockerized Synaptik server.
 */
@ApplicationScoped
@io.quarkus.arc.profile.IfBuildProfile("mcp")
public class SynaptikMcpApiClient {

    @ConfigProperty(name = "synaptik.api.base-url", defaultValue = "http://localhost:9001")
    String apiBaseUrl;

    private SynaptikApiClient apiClient;

    @jakarta.annotation.PostConstruct
    void initialize() {
        this.apiClient = RestClientBuilder.newBuilder()
            .baseUri(URI.create(apiBaseUrl))
            .build(SynaptikApiClient.class);
    }

    @Tool(description = "Get all tasks with optional filtering")
    public Uni<String> getTasks(
            @ToolArg(description = "Filter by task status (PENDING, ACTIVE, COMPLETED, etc.)") String status,
            @ToolArg(description = "Filter by priority (HIGH, MEDIUM, LOW)") String priority,
            @ToolArg(description = "Filter by project name") String project,
            @ToolArg(description = "Filter by assignee name") String assignee,
            @ToolArg(description = "Filter by tags (comma-separated)") String tags,
            @ToolArg(description = "Filter tasks due before this date (ISO format)") String dueBefore,
            @ToolArg(description = "Filter tasks due after this date (ISO format)") String dueAfter,
            @ToolArg(description = "Limit number of results") Integer limit,
            @ToolArg(description = "Sort by field (title, due, priority, etc.)") String sortBy,
            @ToolArg(description = "Sort order (asc, desc)") String sortOrder) {
        return apiClient.getTasks(status, priority, project, assignee, tags, dueBefore, dueAfter, limit, sortBy, sortOrder)
                .map(tasks -> formatTasksResponse(tasks, "All tasks retrieved successfully"));
    }

    @Tool(description = "Get a specific task by ID")
    public Uni<String> getTask(@ToolArg(description = "Task ID") String id) {
        return apiClient.getTask(id)
                .map(task -> formatTaskResponse(task, "Task retrieved successfully"));
    }

    @Tool(description = "Create a new task")
    public Uni<String> createTask(
            @ToolArg(description = "Task title (required)") String title,
            @ToolArg(description = "Task description (optional)", required = false) String description,
            @ToolArg(description = "Task status (optional): PENDING, WAITING, ACTIVE, COMPLETED", required = false) String status,
            @ToolArg(description = "Task priority (optional): HIGH, MEDIUM, LOW", required = false) String priority,
            @ToolArg(description = "Project name (optional)", required = false) String project,
            @ToolArg(description = "Assignee name (optional)", required = false) String assignee,
            @ToolArg(description = "Due date in ISO format (optional)", required = false) String dueDate,
            @ToolArg(description = "Wait until date in ISO format (optional)", required = false) String waitUntil,
            @ToolArg(description = "Task tags comma-separated (optional)", required = false) String tags,
            @ToolArg(description = "Task dependencies comma-separated task IDs (optional)", required = false) String depends) {
        
        TaskCreateRequest request = new TaskCreateRequest();
        request.title = title;
        request.description = description;

        if (status != null) {
            request.status = TaskStatus.valueOf(status.toUpperCase());
        }
        if (priority != null) {
            request.priority = TaskPriority.valueOf(priority.toUpperCase());
        }

        request.project = project;
        request.assignee = assignee;

        if (dueDate != null) {
            request.dueDate = dueDate;
        }
        if (waitUntil != null) {
            request.waitUntil = waitUntil;
        }

        if (tags != null) {
            request.tags = Arrays.asList(tags.split(","));
        }

        return apiClient.createTask(request)
                .map(task -> formatTaskResponse(task, "Task created successfully"));
    }

    @Tool(description = "Mark a task as completed")
    public Uni<String> markTaskDone(@ToolArg(description = "Task ID") String id) {
        return apiClient.markTaskDone(id)
                .map(task -> formatTaskResponse(task, "Task marked as completed"));
    }

    @Tool(description = "Start a task (set status to active)")
    public Uni<String> startTask(@ToolArg(description = "Task ID") String id) {
        return apiClient.startTask(id)
                .map(task -> formatTaskResponse(task, "Task started"));
    }

    @Tool(description = "Get all pending tasks")
    public Uni<String> getPendingTasks() {
        return apiClient.getTasksByStatus("PENDING")
                .map(tasks -> formatTasksResponse(tasks, "Pending tasks retrieved successfully"));
    }

    @Tool(description = "Get all active tasks")
    public Uni<String> getActiveTasks() {
        return apiClient.getTasksByStatus("ACTIVE")
                .map(tasks -> formatTasksResponse(tasks, "Active tasks retrieved successfully"));
    }

    @Tool(description = "Get dashboard overview with task statistics")
    public Uni<String> getDashboard() {
        return apiClient.getDashboard()
                .map(dashboard -> dashboard.toString());
    }

    @Tool(description = "Create a task using TaskWarrior-style quick capture syntax")
    public Uni<String> quickCapture(
            @ToolArg(description = "TaskWarrior-style task input (e.g., 'Buy groceries due:tomorrow +shopping priority:H')") String input) {
        Task task = TaskWarriorParser.parseTaskWarriorInput(input);
        TaskCreateRequest request = new TaskCreateRequest();
        request.title = task.title;
        request.description = task.description;
        request.status = task.status;
        request.priority = task.priority;
        request.project = task.project;
        request.assignee = task.assignee;
        request.dueDate = task.dueDate;
        request.waitUntil = task.waitUntil;
        request.tags = task.tags;

        return apiClient.createTask(request)
                .map(createdTask -> formatTaskResponse(createdTask, "Task captured successfully"));
    }

    // REST Client interface for Synaptik API
    @Path("/api")
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

    // Formatting methods reused from original service
    private String formatTaskResponse(Task task, String message) {
        return String.format(
                "%s:\n\nID: %s\nTitle: %s\nDescription: %s\nStatus: %s\nPriority: %s\nUrgency: %.1f\nDue: %s\nProject: %s\nAssignee: %s\nTags: %s\nCreated: %s\nModified: %s",
                message,
                task.id.toString(),
                task.title,
                task.description != null ? task.description : "N/A",
                task.status,
                task.priority,
                task.urgency != null ? task.urgency : 0.0,
                task.dueDate != null ? task.dueDate.toString() : "N/A",
                task.project != null ? task.project : "N/A",
                task.assignee != null ? task.assignee : "N/A",
                task.tags != null ? String.join(", ", task.tags) : "None",
                task.createdAt != null ? task.createdAt.toString() : "N/A",
                task.updatedAt != null ? task.updatedAt.toString() : "N/A");
    }

    private String formatTasksResponse(List<Task> tasks, String message) {
        if (tasks.isEmpty()) {
            return message + ": No tasks found.";
        }

        StringBuilder response = new StringBuilder();
        response.append(message).append(" (").append(tasks.size()).append(" tasks):\n\n");

        for (Task task : tasks) {
            response.append("• ").append(task.title);
            response.append(" [").append(task.status).append("]");
            if (task.priority != null && task.priority != TaskPriority.NONE) {
                response.append(" (Priority: ").append(task.priority).append(")");
            }
            if (task.dueDate != null) {
                response.append(" (Due: ").append(task.dueDate).append(")");
            }
            response.append("\n");
        }

        return response.toString();
    }
}