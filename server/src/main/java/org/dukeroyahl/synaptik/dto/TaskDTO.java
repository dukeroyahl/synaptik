package org.dukeroyahl.synaptik.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import com.fasterxml.jackson.annotation.JsonInclude;


import java.util.List;
import java.util.UUID;

/**
 * Data Transfer Object for Task API communication.
 * Separates API representation from database entity.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Accessors(chain = true)
@AllArgsConstructor
@NoArgsConstructor
public class TaskDTO {
    
    public UUID id;
    public String title;
    public String description;
    public TaskStatus status;
    public TaskPriority priority;
    public Integer urgency;
    public String assignee;
    public String dueDate;       // ISO 8601 with timezone: "2025-12-31T23:59:59-05:00" or "2025-12-31T23:59:59Z"
    public String waitUntil;     // ISO 8601 with timezone: "2025-11-30T10:00:00+01:00" or "2025-11-30T10:00:00Z"
    public List<String> tags;
    public List<UUID> depends;
    public String originalInput;
    
    // Project information - can be either ID or name depending on context
    public UUID projectId;
    public String projectName;
    
    // Timestamps
    public String createdAt;
    public String updatedAt;
    
    // Entity version for tracking
    public Long version;
}
