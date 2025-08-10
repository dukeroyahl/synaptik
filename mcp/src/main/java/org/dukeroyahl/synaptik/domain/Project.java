package org.dukeroyahl.synaptik.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Project domain class for MCP server - matches server model
 */
public class Project {
    
    public String id;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime updatedAt;
    
    public String name;
    public String description;
    public ProjectStatus status = ProjectStatus.PENDING;
    public Double progress = 0.0;
    public String owner;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime dueDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime startDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime endDate;
    
    public String color;
    
    public List<String> tags = new ArrayList<>();
    public List<String> members = new ArrayList<>();
    
    public void activate() {
        this.status = ProjectStatus.STARTED;
    }
    
    public void complete() {
        this.status = ProjectStatus.COMPLETED;
        this.progress = 100.0;
    }
    
    public void putOnHold() {
        this.status = ProjectStatus.PENDING; // Closest equivalent to ON_HOLD
    }
    
    public void updateProgress(double newProgress) {
        this.progress = Math.max(0.0, Math.min(100.0, newProgress));
        if (this.progress >= 100.0) {
            this.status = ProjectStatus.COMPLETED;
        }
    }
    
    public boolean isOverdue() {
        return dueDate != null && LocalDateTime.now().isAfter(dueDate) && 
               status != ProjectStatus.COMPLETED;
    }
}
