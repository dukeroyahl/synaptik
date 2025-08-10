package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTO for task creation and update requests that includes project name.
 * This allows the API to accept project names while the domain model uses projectId.
 */
public class TaskRequest {
    
    @NotBlank
    @Size(max = 200)
    public String title;
    
    @Size(max = 1000)
    public String description;
    
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    
    // Project name for API requests (will be converted to projectId)
    public String project;
    
    public String assignee;
    public String dueDate;
    public String waitUntil;
    public List<String> tags;
    
    /**
     * Convert this DTO to a Task entity.
     * Note: projectId will be set separately based on the project name.
     */
    public Task toTask() {
        Task task = new Task();
        task.title = this.title;
        task.description = this.description;
        task.status = this.status;
        task.priority = this.priority;
        task.assignee = this.assignee;
        task.dueDate = this.dueDate;
        task.waitUntil = this.waitUntil;
        if (this.tags != null) {
            task.tags = this.tags;
        }
        return task;
    }
    
    /**
     * Get the project name from this request.
     */
    public String getProjectName() {
        return project != null && !project.trim().isEmpty() ? project.trim() : null;
    }
}
