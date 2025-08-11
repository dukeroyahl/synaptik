package org.dukeroyahl.synaptik.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Project domain class for MCP server - matches server model
 */
public class Project {
    
    public String id;
    
    public String createdAt;
    
    public String updatedAt;
    
    public String name;
    public String description;
    public ProjectStatus status = ProjectStatus.PENDING;
    public Double progress = 0.0;
    public String owner;
    
    public String dueDate;
    
    public String startDate;
    
    public String endDate;
    
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
        if (dueDate == null || dueDate.trim().isEmpty()) return false;
        try {
            LocalDateTime due = LocalDateTime.parse(dueDate.trim());
            return LocalDateTime.now().isAfter(due) && status != ProjectStatus.COMPLETED;
        } catch (Exception e) {
            return false; // Invalid date format, not overdue
        }
    }
}
