package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class TaskUpdateRequest {
    
    @Size(max = 200)
    public String title;
    
    @Size(max = 1000)
    public String description;
    
    public TaskStatus status;
    public TaskPriority priority;
    public String project;
    public String assignee;
    public LocalDateTime dueDate;
    public LocalDateTime waitUntil;
    public List<String> tags;
    
    public Task toTask() {
        Task task = new Task();
        task.title = this.title;
        task.description = this.description;
        task.status = this.status;
        task.priority = this.priority;
        task.project = this.project;
        task.assignee = this.assignee;
        task.dueDate = this.dueDate;
        task.waitUntil = this.waitUntil;
        if (this.tags != null) {
            task.tags = this.tags;
        }
        return task;
    }
}