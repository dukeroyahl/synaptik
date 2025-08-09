package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class TaskCreateRequest {
    
    @NotBlank
    @Size(max = 200)
    public String title;
    
    @Size(max = 1000)
    public String description;
    
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    public String project;
    public String assignee;
    public String dueDate;
    public String waitUntil;
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