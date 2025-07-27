package org.dukeroyahl.synaptik.mcp;

import org.dukeroyahl.synaptik.dto.ProjectCreateRequest;
import org.dukeroyahl.synaptik.dto.TaskCreateRequest;
import org.dukeroyahl.synaptik.dto.TaskUpdateRequest;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.service.MindmapService;
import org.dukeroyahl.synaptik.service.ProjectService;
import org.dukeroyahl.synaptik.service.TaskService;
import org.dukeroyahl.synaptik.util.TaskWarriorParser;
import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class SynaptikMcpService {

    @Inject
    TaskService taskService;

    @Inject
    ProjectService projectService;

    @Inject
    MindmapService mindmapService;

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
            @ToolArg(description = "Sort order (asc, desc)") String sortOrder
    ) {
        return taskService.getAllTasks()
                .map(tasks -> formatTasksResponse(tasks, "All tasks retrieved successfully"));
    }

    @Tool(description = "Get a specific task by ID")
    public Uni<String> getTask(
            @ToolArg(description = "Task ID") String id
    ) {
        return taskService.getTaskById(new ObjectId(id))
                .map(task -> formatTaskResponse(task, "Task retrieved successfully"));
    }

    @Tool(description = "Create a new task")
    public Uni<String> createTask(
            @ToolArg(description = "Task title") String title,
            @ToolArg(description = "Task description") String description,
            @ToolArg(description = "Task status (PENDING, WAITING, ACTIVE, COMPLETED)") String status,
            @ToolArg(description = "Task priority (HIGH, MEDIUM, LOW)") String priority,
            @ToolArg(description = "Project name") String project,
            @ToolArg(description = "Assignee name") String assignee,
            @ToolArg(description = "Due date (ISO format)") String dueDate,
            @ToolArg(description = "Wait until date (ISO format)") String waitUntil,
            @ToolArg(description = "Task tags (comma-separated)") String tags,
            @ToolArg(description = "Task dependencies (comma-separated task IDs)") String depends
    ) {
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
            request.dueDate = LocalDateTime.parse(dueDate, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        if (waitUntil != null) {
            request.waitUntil = LocalDateTime.parse(waitUntil, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        
        if (tags != null) {
            request.tags = Arrays.asList(tags.split(","));
        }

        Task task = request.toTask();
        
        // Handle dependencies separately since DTOs don't support them
        if (depends != null) {
            task.depends = Arrays.stream(depends.split(","))
                    .map(ObjectId::new)
                    .collect(Collectors.toList());
        }
        
        return taskService.createTask(task)
                .map(createdTask -> formatTaskResponse(createdTask, "Task created successfully"));
    }

    @Tool(description = "Update an existing task")
    public Uni<String> updateTask(
            @ToolArg(description = "Task ID") String id,
            @ToolArg(description = "Task title") String title,
            @ToolArg(description = "Task description") String description,
            @ToolArg(description = "Task status (PENDING, WAITING, ACTIVE, COMPLETED, DELETED)") String status,
            @ToolArg(description = "Task priority (HIGH, MEDIUM, LOW)") String priority,
            @ToolArg(description = "Project name") String project,
            @ToolArg(description = "Assignee name") String assignee,
            @ToolArg(description = "Due date (ISO format)") String dueDate,
            @ToolArg(description = "Wait until date (ISO format)") String waitUntil,
            @ToolArg(description = "Task tags (comma-separated)") String tags,
            @ToolArg(description = "Task dependencies (comma-separated task IDs)") String depends
    ) {
        TaskUpdateRequest request = new TaskUpdateRequest();
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
            request.dueDate = LocalDateTime.parse(dueDate, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        if (waitUntil != null) {
            request.waitUntil = LocalDateTime.parse(waitUntil, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        
        if (tags != null) {
            request.tags = Arrays.asList(tags.split(","));
        }

        Task updates = request.toTask();
        
        // Handle dependencies separately since DTOs don't support them
        if (depends != null) {
            updates.depends = Arrays.stream(depends.split(","))
                    .map(ObjectId::new)
                    .collect(Collectors.toList());
        }
        
        return taskService.updateTask(new ObjectId(id), updates)
                .map(task -> formatTaskResponse(task, "Task updated successfully"));
    }

    @Tool(description = "Delete a task")
    public Uni<String> deleteTask(
            @ToolArg(description = "Task ID") String id
    ) {
        return taskService.deleteTask(new ObjectId(id))
                .map(result -> "Task deleted successfully: " + id);
    }

    @Tool(description = "Mark a task as completed")
    public Uni<String> markTaskDone(
            @ToolArg(description = "Task ID") String id
    ) {
        return taskService.markTaskDone(new ObjectId(id))
                .map(task -> formatTaskResponse(task, "Task marked as completed"));
    }

    @Tool(description = "Start a task (set status to active)")
    public Uni<String> startTask(
            @ToolArg(description = "Task ID") String id
    ) {
        return taskService.startTask(new ObjectId(id))
                .map(task -> formatTaskResponse(task, "Task started"));
    }

    @Tool(description = "Stop an active task (set status to pending)")
    public Uni<String> stopTask(
            @ToolArg(description = "Task ID") String id
    ) {
        return taskService.stopTask(new ObjectId(id))
                .map(task -> formatTaskResponse(task, "Task stopped"));
    }

    @Tool(description = "Create a task using TaskWarrior-style quick capture syntax")
    public Uni<String> quickCapture(
            @ToolArg(description = "TaskWarrior-style task input (e.g., 'Buy groceries due:tomorrow +shopping priority:H')") String input
    ) {
        Task task = TaskWarriorParser.parseTaskWarriorInput(input);
        return taskService.createTask(task)
                .map(createdTask -> formatTaskResponse(createdTask, "Task captured successfully"));
    }

    @Tool(description = "Get all pending tasks")
    public Uni<String> getPendingTasks() {
        return taskService.getTasksByStatus(TaskStatus.PENDING)
                .map(tasks -> formatTasksResponse(tasks, "Pending tasks retrieved successfully"));
    }

    @Tool(description = "Get all active tasks")
    public Uni<String> getActiveTasks() {
        return taskService.getTasksByStatus(TaskStatus.ACTIVE)
                .map(tasks -> formatTasksResponse(tasks, "Active tasks retrieved successfully"));
    }

    @Tool(description = "Get all completed tasks")
    public Uni<String> getCompletedTasks() {
        return taskService.getTasksByStatus(TaskStatus.COMPLETED)
                .map(tasks -> formatTasksResponse(tasks, "Completed tasks retrieved successfully"));
    }

    @Tool(description = "Get all overdue tasks")
    public Uni<String> getOverdueTasks() {
        return taskService.getOverdueTasks()
                .map(tasks -> formatTasksResponse(tasks, "Overdue tasks retrieved successfully"));
    }

    @Tool(description = "Get tasks due today")
    public Uni<String> getTodayTasks() {
        return taskService.getTodayTasks()
                .map(tasks -> formatTasksResponse(tasks, "Today's tasks retrieved successfully"));
    }

    @Tool(description = "Get all projects")
    public Uni<String> getProjects() {
        return projectService.getAllProjects()
                .map(projects -> formatProjectsResponse(projects, "Projects retrieved successfully"));
    }

    @Tool(description = "Create a new project")
    public Uni<String> createProject(
            @ToolArg(description = "Project name") String name,
            @ToolArg(description = "Project description") String description,
            @ToolArg(description = "Project color") String color
    ) {
        ProjectCreateRequest request = new ProjectCreateRequest();
        request.name = name;
        request.description = description;
        request.color = color;

        Project project = request.toProject();
        return projectService.createProject(project)
                .map(createdProject -> formatProjectResponse(createdProject, "Project created successfully"));
    }

    @Tool(description = "Get all mindmaps")
    public Uni<String> getMindmaps() {
        return mindmapService.getAllMindmaps()
                .map(mindmaps -> formatMindmapsResponse(mindmaps, "Mindmaps retrieved successfully"));
    }

    @Tool(description = "Get dashboard overview with task statistics")
    public Uni<String> getDashboard() {
        return Uni.combine().all()
                .unis(
                        taskService.getTasksByStatus(TaskStatus.PENDING),
                        taskService.getTasksByStatus(TaskStatus.ACTIVE),
                        taskService.getTasksByStatus(TaskStatus.COMPLETED),
                        taskService.getOverdueTasks(),
                        taskService.getTodayTasks(),
                        projectService.getAllProjects()
                )
                .asTuple()
                .map(tuple -> {
                    List<Task> pending = tuple.getItem1();
                    List<Task> active = tuple.getItem2();
                    List<Task> completed = tuple.getItem3();
                    List<Task> overdue = tuple.getItem4();
                    List<Task> today = tuple.getItem5();
                    List<Project> projects = tuple.getItem6();

                    StringBuilder dashboard = new StringBuilder();
                    dashboard.append("=== SYNAPTIK DASHBOARD ===\n\n");
                    dashboard.append("📊 TASK STATISTICS:\n");
                    dashboard.append("• Pending: ").append(pending.size()).append(" tasks\n");
                    dashboard.append("• Active: ").append(active.size()).append(" tasks\n");
                    dashboard.append("• Completed: ").append(completed.size()).append(" tasks\n");
                    dashboard.append("• Overdue: ").append(overdue.size()).append(" tasks\n");
                    dashboard.append("• Due Today: ").append(today.size()).append(" tasks\n\n");
                    
                    dashboard.append("📁 PROJECTS: ").append(projects.size()).append(" total\n\n");
                    
                    if (!overdue.isEmpty()) {
                        dashboard.append("⚠️ OVERDUE TASKS:\n");
                        overdue.forEach(task -> 
                            dashboard.append("• ").append(task.title).append(" (Due: ").append(task.dueDate).append(")\n")
                        );
                        dashboard.append("\n");
                    }
                    
                    if (!today.isEmpty()) {
                        dashboard.append("📅 TODAY'S TASKS:\n");
                        today.forEach(task -> 
                            dashboard.append("• ").append(task.title).append(" [").append(task.status).append("]\n")
                        );
                        dashboard.append("\n");
                    }
                    
                    if (!active.isEmpty()) {
                        dashboard.append("🔥 ACTIVE TASKS:\n");
                        active.forEach(task -> 
                            dashboard.append("• ").append(task.title).append("\n")
                        );
                    }

                    return dashboard.toString();
                });
    }

    private String formatTaskResponse(Task task, String message) {
        return String.format("%s:\n\nID: %s\nTitle: %s\nDescription: %s\nStatus: %s\nPriority: %s\nUrgency: %.1f\nDue: %s\nProject: %s\nAssignee: %s\nTags: %s\nCreated: %s\nModified: %s",
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
                task.updatedAt != null ? task.updatedAt.toString() : "N/A"
        );
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

    private String formatProjectResponse(Project project, String message) {
        return String.format("%s:\n\nID: %s\nName: %s\nDescription: %s\nStatus: %s\nProgress: %.0f%%\nCreated: %s\nModified: %s",
                message,
                project.id.toString(),
                project.name,
                project.description != null ? project.description : "N/A",
                project.status,
                project.progress,
                project.createdAt != null ? project.createdAt.toString() : "N/A",
                project.updatedAt != null ? project.updatedAt.toString() : "N/A"
        );
    }

    private String formatProjectsResponse(List<Project> projects, String message) {
        if (projects.isEmpty()) {
            return message + ": No projects found.";
        }

        StringBuilder response = new StringBuilder();
        response.append(message).append(" (").append(projects.size()).append(" projects):\n\n");
        
        for (Project project : projects) {
            response.append("• ").append(project.name);
            response.append(" [").append(project.status).append("]");
            response.append(" (").append(project.progress).append("% complete)");
            response.append("\n");
        }
        
        return response.toString();
    }

    private String formatMindmapsResponse(List<?> mindmaps, String message) {
        if (mindmaps.isEmpty()) {
            return message + ": No mindmaps found.";
        }

        StringBuilder response = new StringBuilder();
        response.append(message).append(" (").append(mindmaps.size()).append(" mindmaps):\n\n");
        
        // For now, just show count since mindmap structure may vary
        response.append("Available mindmaps: ").append(mindmaps.size());
        
        return response.toString();
    }
}