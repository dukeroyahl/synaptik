package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.TaskStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request DTO for updating task status
 */
public class StatusUpdateRequest {
    
    @JsonProperty("status")
    public TaskStatus status;
    
    public StatusUpdateRequest() {
        // Default constructor for Jackson
    }
    
    public StatusUpdateRequest(TaskStatus status) {
        this.status = status;
    }
    
    @Override
    public String toString() {
        return "StatusUpdateRequest{status=" + status + "}";
    }
}
