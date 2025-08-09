package org.dukeroyahl.synaptik.domain;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Simplified Project domain class for MCP server
 */
public class Project {
    
    public String id;
    public ZonedDateTime createdAt;
    public ZonedDateTime updatedAt;
    
    public String name;
    public String description;
    public ProjectStatus status = ProjectStatus.PLANNING;
    public Double progress = 0.0;
    public String owner;
    
    // Store as string to avoid serialization issues
    public String dueDate;
    public String startDate;
    
    public List<String> tags = new ArrayList<>();
    public List<String> collaborators = new ArrayList<>();
    
    public void activate() {
        this.status = ProjectStatus.ACTIVE;
    }
    
    public void complete() {
        this.status = ProjectStatus.COMPLETED;
        this.progress = 100.0;
    }
    
    public void putOnHold() {
        this.status = ProjectStatus.ON_HOLD;
    }
    
    public void updateProgress(double newProgress) {
        this.progress = Math.max(0.0, Math.min(100.0, newProgress));
        if (this.progress >= 100.0) {
            this.status = ProjectStatus.COMPLETED;
        }
    }
    
    public boolean isOverdue() {
        if (dueDate == null || status == ProjectStatus.COMPLETED) {
            return false;
        }
        
        try {
            ZonedDateTime due = ZonedDateTime.parse(dueDate);
            return due.isBefore(ZonedDateTime.now());
        } catch (Exception e) {
            return false;
        }
    }
}
