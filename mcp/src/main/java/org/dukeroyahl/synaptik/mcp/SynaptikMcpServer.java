package org.dukeroyahl.synaptik.mcp;

import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import jakarta.inject.Singleton;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
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
                .map(tasks -> formatTasksResponse(tasks, "All tasks"));
    }

    @Tool(description = "Get a specific task by ID")
    public Uni<String> getTask(@ToolArg(description = "Task ID") String taskId) {
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
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
        
        org.dukeroyahl.synaptik.dto.TaskRequest taskRequest = new org.dukeroyahl.synaptik.dto.TaskRequest();
        taskRequest.title = title;
        taskRequest.description = description;
        taskRequest.project = project;
        taskRequest.assignee = assignee;
        taskRequest.dueDate = dueDate;
        
        if (priority != null) {
            try {
                taskRequest.priority = TaskPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                taskRequest.priority = TaskPriority.MEDIUM;
            }
        }
        
        if (tags != null && !tags.trim().isEmpty()) {
            taskRequest.tags = Arrays.asList(tags.split(","));
        }
        
        return apiClient.createTask(taskRequest)
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
        
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
        
        org.dukeroyahl.synaptik.dto.TaskRequest taskRequest = new org.dukeroyahl.synaptik.dto.TaskRequest();
        if (title != null) taskRequest.title = title;
        if (description != null) taskRequest.description = description;
        if (project != null) taskRequest.project = project;
        if (assignee != null) taskRequest.assignee = assignee;
        if (dueDate != null) taskRequest.dueDate = dueDate;
        
        if (priority != null) {
            try {
                taskRequest.priority = TaskPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                return Uni.createFrom().item("❌ Invalid priority. Use: HIGH, MEDIUM, LOW, NONE");
            }
        }
        
        return apiClient.updateTask(taskId, taskRequest)
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
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
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
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
        return apiClient.updateTaskStatus(taskId, TaskStatus.ACTIVE)
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
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
        return apiClient.updateTaskStatus(taskId, TaskStatus.PENDING)
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
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
        return apiClient.updateTaskStatus(taskId, TaskStatus.COMPLETED)
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
        return apiClient.searchTasks(null, null, null, null, Arrays.asList("PENDING"), null, null)
                .map(tasks -> formatTasksResponseWithEmoji(tasks, "Pending tasks", "⏳"));
    }

    @Tool(description = "Get all active tasks")
    public Uni<String> getActiveTasks() {
        return apiClient.searchTasks(null, null, null, null, Arrays.asList("ACTIVE"), null, null)
                .map(tasks -> formatTasksResponseWithEmoji(tasks, "Active tasks", "🔄"));
    }

    @Tool(description = "Get all completed tasks")
    public Uni<String> getCompletedTasks() {
        return apiClient.searchTasks(null, null, null, null, Arrays.asList("COMPLETED"), null, null)
                .map(tasks -> formatTasksResponseWithEmoji(tasks, "Completed tasks", "✅"));
    }

    @Tool(description = "Get all overdue tasks")
    public Uni<String> getOverdueTasks() {
        // Get the user's current timezone
        String userTimezone = java.time.ZoneId.systemDefault().getId();
        return apiClient.getOverdueTasks(userTimezone)
                .map(tasks -> formatTasksResponse(tasks, "Overdue tasks (timezone: " + userTimezone + ")"));
    }

    @Tool(description = "Get today's tasks")
    public Uni<String> getTodayTasks() {
        // Get the user's current timezone
        String userTimezone = java.time.ZoneId.systemDefault().getId();
        return apiClient.getTodayTasks(userTimezone)
                .map(tasks -> formatTasksResponse(tasks, "Today's tasks (timezone: " + userTimezone + ")"));
    }

    @Tool(description = "Search tasks with multiple filters")
    public Uni<String> searchTasks(
            @ToolArg(description = "Assignee name (partial match, optional)") String assignee,
            @ToolArg(description = "Date from (ISO format, optional): 2024-01-01T00:00:00Z") String dateFrom,
            @ToolArg(description = "Date to (ISO format, optional): 2024-12-31T23:59:59Z") String dateTo,
            @ToolArg(description = "Project ID (exact UUID match, optional)") String projectId,
            @ToolArg(description = "Task statuses (comma-separated, optional): PENDING,ACTIVE,COMPLETED") String status,
            @ToolArg(description = "Task title (partial match, optional)") String title,
            @ToolArg(description = "Timezone (optional, default: system timezone)") String timezone) {
        
        // Use system timezone if not provided
        String userTimezone = (timezone != null && !timezone.trim().isEmpty()) 
            ? timezone.trim() 
            : java.time.ZoneId.systemDefault().getId();
        
        // Validate project ID if provided
        if (projectId != null && !projectId.trim().isEmpty() && !isValidUUID(projectId.trim())) {
            return Uni.createFrom().item("❌ Invalid project ID format. Please provide a valid UUID.");
        }
        
        // Clean up empty parameters
        String cleanAssignee = (assignee != null && !assignee.trim().isEmpty()) ? assignee.trim() : null;
        String cleanDateFrom = (dateFrom != null && !dateFrom.trim().isEmpty()) ? dateFrom.trim() : null;
        String cleanDateTo = (dateTo != null && !dateTo.trim().isEmpty()) ? dateTo.trim() : null;
        String cleanProjectId = (projectId != null && !projectId.trim().isEmpty()) ? projectId.trim() : null;
        String cleanTitle = (title != null && !title.trim().isEmpty()) ? title.trim() : null;
        
        // Parse status parameter into list
        final List<String> statusList;
        if (status != null && !status.trim().isEmpty()) {
            statusList = Arrays.stream(status.trim().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        } else {
            statusList = null;
        }
        
        return apiClient.searchTasks(cleanAssignee, cleanDateFrom, cleanDateTo, cleanProjectId, statusList, cleanTitle, userTimezone)
                .map(tasks -> {
                    StringBuilder searchCriteria = new StringBuilder();
                    if (cleanAssignee != null) searchCriteria.append("👤 Assignee: ").append(cleanAssignee).append(" ");
                    if (cleanTitle != null) searchCriteria.append("📝 Title: ").append(cleanTitle).append(" ");
                    if (statusList != null && !statusList.isEmpty()) searchCriteria.append("📊 Status: ").append(String.join(",", statusList)).append(" ");
                    if (cleanProjectId != null) searchCriteria.append("📁 Project: ").append(cleanProjectId).append(" ");
                    if (cleanDateFrom != null) searchCriteria.append("📅 From: ").append(cleanDateFrom).append(" ");
                    if (cleanDateTo != null) searchCriteria.append("📅 To: ").append(cleanDateTo).append(" ");
                    searchCriteria.append("🌍 Timezone: ").append(userTimezone);
                    
                    String searchTitle = "🔍 Task search results (" + searchCriteria.toString().trim() + ")";
                    return formatTasksResponse(tasks, searchTitle);
                });
    }

    // ===== TASK GRAPH AND DEPENDENCY TOOLS =====

    @Tool(description = "Get task dependency graph with optional status filtering")
    public Uni<String> getTaskGraph(@ToolArg(description = "Comma-separated task statuses to filter (optional): PENDING,STARTED,COMPLETED") String statuses) {
        return apiClient.getTaskGraph(statuses)
                .map(graph -> formatTaskGraphResponse(graph));
    }

    @Tool(description = "Get task neighbors (dependencies and dependents) for a specific task")
    public Uni<String> getTaskNeighbors(
            @ToolArg(description = "Task ID") String taskId,
            @ToolArg(description = "Depth of neighbors to include (default: 1)") String depth,
            @ToolArg(description = "Include placeholder tasks (default: true)") String includePlaceholders) {
        
        if (!isValidUUID(taskId)) {
            return Uni.createFrom().item("❌ Invalid task ID format. Please provide a valid UUID.");
        }
        
        int depthValue = 1;
        boolean includePlaceholdersValue = true;
        
        try {
            if (depth != null && !depth.trim().isEmpty()) {
                depthValue = Integer.parseInt(depth.trim());
            }
        } catch (NumberFormatException e) {
            return Uni.createFrom().item("❌ Invalid depth value. Please provide a valid integer.");
        }
        
        try {
            if (includePlaceholders != null && !includePlaceholders.trim().isEmpty()) {
                includePlaceholdersValue = Boolean.parseBoolean(includePlaceholders.trim());
            }
        } catch (Exception e) {
            return Uni.createFrom().item("❌ Invalid includePlaceholders value. Please provide true or false.");
        }
        
        // Make variables effectively final for lambda
        final int finalDepthValue = depthValue;
        final boolean finalIncludePlaceholdersValue = includePlaceholdersValue;
        
        return apiClient.getTaskNeighbors(taskId, finalDepthValue, finalIncludePlaceholdersValue)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        // The response should contain a TaskGraphResponse
                        return "✅ Task neighbors retrieved successfully for task: " + taskId + 
                               "\n📊 Depth: " + finalDepthValue + 
                               "\n🔗 Include placeholders: " + finalIncludePlaceholdersValue +
                               "\n\n" + response.readEntity(String.class);
                    } else {
                        return "❌ Failed to get task neighbors: " + response.readEntity(String.class);
                    }
                });
    }

    // ===== PROJECT MANAGEMENT TOOLS =====

    @Tool(description = "Get all projects")
    public Uni<String> getAllProjects() {
        return apiClient.getAllProjects()
                .map(projects -> formatProjectsResponse(projects, "All projects"));
    }

    @Tool(description = "Get a specific project by ID")
    public Uni<String> getProject(@ToolArg(description = "Project ID") String projectId) {
        if (!isValidUUID(projectId)) {
            return Uni.createFrom().item("❌ Invalid project ID format. Please provide a valid UUID.");
        }
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
        
        // Parse dueDate string to LocalDateTime if provided
        if (dueDate != null && !dueDate.trim().isEmpty()) {
            try {
                project.dueDate = java.time.LocalDateTime.parse(dueDate.trim());
            } catch (Exception e) {
                return Uni.createFrom().item("❌ Invalid date format. Please use ISO format like: 2024-12-31T23:59:59");
            }
        }
        
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

    @Tool(description = "Start a project")
    public Uni<String> activateProject(@ToolArg(description = "Project ID") String projectId) {
        if (!isValidUUID(projectId)) {
            return Uni.createFrom().item("❌ Invalid project ID format. Please provide a valid UUID.");
        }
        return apiClient.startProject(projectId)
                .map(response -> {
                    if (response.getStatus() == 200) {
                        Project project = response.readEntity(Project.class);
                        return formatSingleProjectResponse(project, "✅ Project started");
                    } else {
                        return "❌ Failed to start project: " + response.getStatusInfo().getReasonPhrase();
                    }
                });
    }

    @Tool(description = "Complete a project")
    public Uni<String> completeProject(@ToolArg(description = "Project ID") String projectId) {
        if (!isValidUUID(projectId)) {
            return Uni.createFrom().item("❌ Invalid project ID format. Please provide a valid UUID.");
        }
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

    private boolean isValidUUID(String uuid) {
        if (uuid == null || uuid.trim().isEmpty()) {
            return false;
        }
        try {
            java.util.UUID.fromString(uuid.trim());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String formatTasksResponse(List<Task> tasks, String title) {
        return formatTasksResponseWithEmoji(tasks, title, "📋");
    }

    private String formatTasksResponseWithEmoji(List<Task> tasks, String title, String emoji) {
        if (tasks == null || tasks.isEmpty()) {
            return emoji + " " + title + ": No tasks found";
        }

        StringBuilder sb = new StringBuilder();
        sb.append(emoji).append(" ").append(title).append(" (").append(tasks.size()).append(" tasks):\n\n");

        for (Task task : tasks) {
            sb.append(formatTaskSummary(task)).append("\n");
        }

        // Add total summary
        sb.append("\n📊 Total: ").append(tasks.size()).append(" tasks");

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
        
        if (task.projectName != null) {
            sb.append(" [").append(task.projectName).append("]");
        } else if (task.projectId != null) {
            sb.append(" [Project: ").append(task.projectId).append("]");
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
        if (task.projectName != null) {
            sb.append("  Project: ").append(task.projectName).append("\n");
        } else if (task.projectId != null) {
            sb.append("  Project ID: ").append(task.projectId).append("\n");
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
            case ACTIVE -> "🔄";
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

    private String formatTaskGraphResponse(org.dukeroyahl.synaptik.dto.TaskGraphResponse graph) {
        if (graph == null) {
            return "❌ No graph data available";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("🕸️ Task Dependency Graph\n");
        sb.append("═══════════════════════\n\n");
        
        if (graph.centerId() != null) {
            sb.append("🎯 Center Task: ").append(graph.centerId()).append("\n");
        }
        
        sb.append("📊 Nodes: ").append(graph.nodes() != null ? graph.nodes().size() : 0).append("\n");
        sb.append("🔗 Edges: ").append(graph.edges() != null ? graph.edges().size() : 0).append("\n");
        sb.append("🔄 Has Cycles: ").append(graph.hasCycles() ? "Yes ⚠️" : "No ✅").append("\n\n");

        if (graph.nodes() != null && !graph.nodes().isEmpty()) {
            sb.append("📋 Tasks in Graph:\n");
            sb.append("─────────────────\n");
            
            for (org.dukeroyahl.synaptik.dto.TaskGraphNode node : graph.nodes()) {
                String statusIcon = getStatusIcon(node.status());
                String priorityIcon = "⚪"; // default
                
                try {
                    if (node.priority() != null && !node.priority().trim().isEmpty()) {
                        priorityIcon = getPriorityIcon(org.dukeroyahl.synaptik.domain.TaskPriority.valueOf(node.priority().toUpperCase()));
                    }
                } catch (IllegalArgumentException e) {
                    // Keep default priority icon if parsing fails
                }
                
                sb.append(statusIcon).append(" ");
                sb.append(priorityIcon).append(" ");
                sb.append(node.title());
                
                if (node.placeholder()) {
                    sb.append(" 👻 (placeholder)");
                }
                
                if (node.project() != null && !node.project().trim().isEmpty()) {
                    sb.append(" 📁 ").append(node.project());
                }
                
                if (node.assignee() != null && !node.assignee().trim().isEmpty()) {
                    sb.append(" 👤 ").append(node.assignee());
                }
                
                if (node.urgency() != null) {
                    sb.append(" ⚡ ").append(String.format("%.1f", node.urgency()));
                }
                
                sb.append("\n");
            }
        }

        if (graph.edges() != null && !graph.edges().isEmpty()) {
            sb.append("\n🔗 Dependencies:\n");
            sb.append("───────────────\n");
            
            for (org.dukeroyahl.synaptik.dto.TaskGraphEdge edge : graph.edges()) {
                sb.append("  ").append(edge.from()).append(" → ").append(edge.to()).append("\n");
            }
        }

        return sb.toString();
    }
}
