package org.dukeroyahl.synaptik.mcp;

import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;

import jakarta.inject.Singleton;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.annotation.PostConstruct;

/**
 * MCP service that calls Synaptik API via HTTP.
 * Tool set for task and project management.
 */
@Singleton
public class SynaptikMcpServer {

    private static final Logger LOG = Logger.getLogger(SynaptikMcpServer.class.getName());

    @Inject
    @RestClient
    SynaptikApiClient apiClient;

    @PostConstruct
    void init() {
        LOG.info("SynaptikMcpServer initialized - checking tool registration");
        LOG.info("API Client injected: " + (apiClient != null ? "SUCCESS" : "FAILED"));
        
        // Log all methods with @Tool annotation
        java.lang.reflect.Method[] methods = this.getClass().getDeclaredMethods();
        int toolCount = 0;
        for (java.lang.reflect.Method method : methods) {
            if (method.isAnnotationPresent(Tool.class)) {
                toolCount++;
                Tool toolAnnotation = method.getAnnotation(Tool.class);
                LOG.info("Found @Tool method: " + method.getName() + " - " + toolAnnotation.description());
            }
        }
        LOG.info("Total @Tool methods found: " + toolCount);
    }

    // ===== TASK MANAGEMENT TOOLS =====

    @Tool(description = "Get all tasks from Synaptik")
    public Uni<String> getAllTasks() {
        return apiClient.getAllTasks()
                .map(tasks -> formatTasksResponse(tasks, "Retrieved all tasks"));
    }

    @Tool(description = "Get a specific task by ID")
    public Uni<String> getTask(@ToolArg(description = "Task ID") String taskId) {
        return apiClient.getTask(taskId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Task task = response.readEntity(Task.class);
                        return formatSingleTaskResponse(task, "Task retrieved successfully");
                    } else {
                        return "❌ Task not found with ID: " + taskId;
                    }
                });
    }

    @Tool(description = "Create a new task")
    public Uni<String> createTask(
            @ToolArg(description = "Task title") String title,
            @ToolArg(description = "Task description (optional)") String description,
            @ToolArg(description = "Task priority: HIGH, MEDIUM, LOW, NONE") String priority,
            @ToolArg(description = "Project name (optional)") String project,
            @ToolArg(description = "Assignee name (optional)") String assignee,
            @ToolArg(description = "Due date in ISO format (optional)") String dueDate,
            @ToolArg(description = "Tags comma-separated (optional)") String tags) {
        
        Task task = new Task();
        task.title = title;
        task.description = description;
        task.project = project;
        task.assignee = assignee;
        task.dueDate = dueDate;
        
        if (priority != null) {
            try {
                task.priority = TaskPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                task.priority = TaskPriority.MEDIUM;
            }
        }
        
        if (tags != null && !tags.trim().isEmpty()) {
            task.tags = Arrays.asList(tags.split(","));
        }
        
        return apiClient.createTask(task)
                .map(response -> {
                    if (response.getStatus() == 201) {
                        Task createdTask = response.readEntity(Task.class);
                        return formatSingleTaskResponse(createdTask, "✅ Task created successfully");
                    } else {
                        return "❌ Failed to create task: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Update an existing task")
    public Uni<String> updateTask(
            @ToolArg(description = "Task ID") String taskId,
            @ToolArg(description = "New title (optional)") String title,
            @ToolArg(description = "New description (optional)") String description,
            @ToolArg(description = "New priority: HIGH, MEDIUM, LOW, NONE (optional)") String priority,
            @ToolArg(description = "New project name (optional)") String project,
            @ToolArg(description = "New assignee (optional)") String assignee,
            @ToolArg(description = "New due date in ISO format (optional)") String dueDate) {
        
        Task updates = new Task();
        if (title != null) updates.title = title;
        if (description != null) updates.description = description;
        if (project != null) updates.project = project;
        if (assignee != null) updates.assignee = assignee;
        if (dueDate != null) updates.dueDate = dueDate;
        
        if (priority != null) {
            try {
                updates.priority = TaskPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                return Uni.createFrom().item("❌ Invalid priority. Use: HIGH, MEDIUM, LOW, NONE");
            }
        }
        
        return apiClient.updateTask(taskId, updates)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Task updatedTask = response.readEntity(Task.class);
                        return formatSingleTaskResponse(updatedTask, "✅ Task updated successfully");
                    } else {
                        return "❌ Failed to update task: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Delete a task")
    public Uni<String> deleteTask(@ToolArg(description = "Task ID") String taskId) {
        return apiClient.deleteTask(taskId)
                .map(response -> {
                    if (response.getStatus() == 204) {
                        return "✅ Task deleted successfully";
                    } else {
                        return "❌ Failed to delete task: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Start working on a task")
    public Uni<String> startTask(@ToolArg(description = "Task ID") String taskId) {
        return apiClient.startTask(taskId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Task task = response.readEntity(Task.class);
                        return formatSingleTaskResponse(task, "✅ Task started");
                    } else {
                        return "❌ Failed to start task: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Stop working on a task")
    public Uni<String> stopTask(@ToolArg(description = "Task ID") String taskId) {
        return apiClient.stopTask(taskId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Task task = response.readEntity(Task.class);
                        return formatSingleTaskResponse(task, "✅ Task stopped");
                    } else {
                        return "❌ Failed to stop task: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Mark a task as done/completed")
    public Uni<String> markTaskDone(@ToolArg(description = "Task ID") String taskId) {
        return apiClient.markTaskDone(taskId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Task task = response.readEntity(Task.class);
                        return formatSingleTaskResponse(task, "✅ Task marked as done");
                    } else {
                        return "❌ Failed to mark task as done: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Get all pending tasks")
    public Uni<String> getPendingTasks() {
        return apiClient.getPendingTasks()
                .map(tasks -> formatTasksResponse(tasks, "Pending tasks"));
    }

    @Tool(description = "Get all started tasks")
    public Uni<String> getStartedTasks() {
        return apiClient.getStartedTasks()
                .map(tasks -> formatTasksResponse(tasks, "Started tasks"));
    }

    @Tool(description = "Get all completed tasks")
    public Uni<String> getCompletedTasks() {
        return apiClient.getCompletedTasks()
                .map(tasks -> formatTasksResponse(tasks, "Completed tasks"));
    }

    @Tool(description = "Get all overdue tasks")
    public Uni<String> getOverdueTasks() {
        return apiClient.getOverdueTasks()
                .map(tasks -> formatTasksResponse(tasks, "Overdue tasks"));
    }

    @Tool(description = "Get today's tasks")
    public Uni<String> getTodayTasks() {
        return apiClient.getTodayTasks()
                .map(tasks -> formatTasksResponse(tasks, "Today's tasks"));
    }

    // ===== PROJECT MANAGEMENT TOOLS =====

    @Tool(description = "Get all projects")
    public Uni<String> getAllProjects() {
        return apiClient.getAllProjects()
                .map(projects -> formatProjectsResponse(projects, "All projects"));
    }

    @Tool(description = "Get a specific project by ID")
    public Uni<String> getProject(@ToolArg(description = "Project ID") String projectId) {
        return apiClient.getProject(projectId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Project project = response.readEntity(Project.class);
                        return formatSingleProjectResponse(project, "Project retrieved successfully");
                    } else {
                        return "❌ Project not found with ID: " + projectId;
                    }
                });
    }

    @Tool(description = "Create a new project")
    public Uni<String> createProject(
            @ToolArg(description = "Project name") String name,
            @ToolArg(description = "Project description (optional)") String description,
            @ToolArg(description = "Project owner (optional)") String owner,
            @ToolArg(description = "Due date in ISO format (optional)") String dueDate) {
        
        Project project = new Project();
        project.name = name;
        project.description = description;
        project.owner = owner;
        project.dueDate = dueDate;
        
        return apiClient.createProject(project)
                .map(response -> {
                    if (response.getStatus() == 201) {
                        Project createdProject = response.readEntity(Project.class);
                        return formatSingleProjectResponse(createdProject, "✅ Project created successfully");
                    } else {
                        return "❌ Failed to create project: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Get active projects")
    public Uni<String> getActiveProjects() {
        return apiClient.getActiveProjects()
                .map(projects -> formatProjectsResponse(projects, "Active projects"));
    }

    @Tool(description = "Get overdue projects")
    public Uni<String> getOverdueProjects() {
        return apiClient.getOverdueProjects()
                .map(projects -> formatProjectsResponse(projects, "Overdue projects"));
    }

    @Tool(description = "Activate a project")
    public Uni<String> activateProject(@ToolArg(description = "Project ID") String projectId) {
        return apiClient.activateProject(projectId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Project project = response.readEntity(Project.class);
                        return formatSingleProjectResponse(project, "✅ Project activated");
                    } else {
                        return "❌ Failed to activate project: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Complete a project")
    public Uni<String> completeProject(@ToolArg(description = "Project ID") String projectId) {
        return apiClient.completeProject(projectId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Project project = response.readEntity(Project.class);
                        return formatSingleProjectResponse(project, "✅ Project completed");
                    } else {
                        return "❌ Failed to complete project: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }


    // ===== HELPER METHODS =====

    private String formatTasksResponse(List<Task> tasks, String title) {
        if (tasks == null || tasks.isEmpty()) {
            return "📋 " + title + ": No tasks found";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("📋 ").append(title).append(" (").append(tasks.size()).append(" tasks):\n\n");

        for (Task task : tasks) {
            sb.append(formatTaskSummary(task)).append("\n");
        }

        return sb.toString();
    }

    private String formatSingleTaskResponse(Task task, String message) {
        StringBuilder sb = new StringBuilder();
        sb.append(message).append("\n\n");
        sb.append(formatTaskDetails(task));
        return sb.toString();
    }

    private String formatTaskSummary(Task task) {
        String statusIcon = getStatusIcon(task.status);
        String priorityIcon = getPriorityIcon(task.priority);
        
        StringBuilder sb = new StringBuilder();
        sb.append(statusIcon).append(" ").append(priorityIcon).append(" ");
        sb.append(task.title);
        
        if (task.project != null) {
            sb.append(" [").append(task.project).append("]");
        }
        
        if (task.dueDate != null) {
            sb.append(" 📅 ").append(task.dueDate);
        }
        
        sb.append(" (ID: ").append(task.id).append(")");
        
        return sb.toString();
    }

    private String formatTaskDetails(Task task) {
        StringBuilder sb = new StringBuilder();
        sb.append("📋 Task Details:\n");
        sb.append("  ID: ").append(task.id).append("\n");
        sb.append("  Title: ").append(task.title).append("\n");
        sb.append("  Status: ").append(getStatusIcon(task.status)).append(" ").append(task.status).append("\n");
        sb.append("  Priority: ").append(getPriorityIcon(task.priority)).append(" ").append(task.priority).append("\n");
        
        if (task.description != null) {
            sb.append("  Description: ").append(task.description).append("\n");
        }
        if (task.project != null) {
            sb.append("  Project: ").append(task.project).append("\n");
        }
        if (task.assignee != null) {
            sb.append("  Assignee: ").append(task.assignee).append("\n");
        }
        if (task.dueDate != null) {
            sb.append("  Due Date: ").append(task.dueDate).append("\n");
        }
        if (task.tags != null && !task.tags.isEmpty()) {
            sb.append("  Tags: ").append(String.join(", ", task.tags)).append("\n");
        }
        
        return sb.toString();
    }

    private String formatProjectsResponse(List<Project> projects, String title) {
        if (projects == null || projects.isEmpty()) {
            return "📁 " + title + ": No projects found";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("📁 ").append(title).append(" (").append(projects.size()).append(" projects):\n\n");

        for (Project project : projects) {
            sb.append(formatProjectSummary(project)).append("\n");
        }

        return sb.toString();
    }

    private String formatSingleProjectResponse(Project project, String message) {
        StringBuilder sb = new StringBuilder();
        sb.append(message).append("\n\n");
        sb.append(formatProjectDetails(project));
        return sb.toString();
    }

    private String formatProjectSummary(Project project) {
        StringBuilder sb = new StringBuilder();
        sb.append("📁 ").append(project.name);
        
        if (project.status != null) {
            sb.append(" [").append(project.status).append("]");
        }
        
        if (project.owner != null) {
            sb.append(" 👤 ").append(project.owner);
        }
        
        if (project.dueDate != null) {
            sb.append(" 📅 ").append(project.dueDate);
        }
        
        sb.append(" (ID: ").append(project.id).append(")");
        
        return sb.toString();
    }

    private String formatProjectDetails(Project project) {
        StringBuilder sb = new StringBuilder();
        sb.append("📁 Project Details:\n");
        sb.append("  ID: ").append(project.id).append("\n");
        sb.append("  Name: ").append(project.name).append("\n");
        
        if (project.status != null) {
            sb.append("  Status: ").append(project.status).append("\n");
        }
        if (project.description != null) {
            sb.append("  Description: ").append(project.description).append("\n");
        }
        if (project.owner != null) {
            sb.append("  Owner: ").append(project.owner).append("\n");
        }
        if (project.dueDate != null) {
            sb.append("  Due Date: ").append(project.dueDate).append("\n");
        }
        
        return sb.toString();
    }


    private String getStatusIcon(TaskStatus status) {
        if (status == null) return "❓";
        return switch (status) {
            case PENDING -> "⏳";
            case WAITING -> "⏸️";
            case STARTED -> "🔄";
            case COMPLETED -> "✅";
            case DELETED -> "🗑️";
        };
    }

    private String getPriorityIcon(TaskPriority priority) {
        if (priority == null) return "⚪";
        return switch (priority) {
            case HIGH -> "🔴";
            case MEDIUM -> "🟡";
            case LOW -> "🟢";
            case NONE -> "⚪";
        };
    }
}
