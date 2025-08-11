package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * DTO for task creation and update requests that includes project name.
 * This allows the API to accept project names while the domain model uses projectId.
 */
public class TaskRequest {

    public UUID id;

    @NotBlank
    @Size(max = 200)
    public String title;
    
    @Size(max = 1000)
    public String description;
    
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    
    // Project name for API requests (will be converted to projectId)
    public String projectName;
    public UUID projectId;
    
    public String assignee;
    public String dueDate;       // ISO 8601 with timezone: "2025-12-31T23:59:59-05:00" or "2025-12-31T23:59:59Z"
    public String waitUntil;     // ISO 8601 with timezone: "2025-11-30T10:00:00+01:00" or "2025-11-30T10:00:00Z"
    public List<String> tags;
}
