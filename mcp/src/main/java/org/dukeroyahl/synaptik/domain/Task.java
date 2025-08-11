package org.dukeroyahl.synaptik.domain;

import java.time.ZonedDateTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Simplified Task domain class for MCP server aligned with backend Task
 */
public class Task {
    
    public String id;
    public String createdAt;
    public String updatedAt;
    
    public String title;
    public String description;
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    public Integer urgency;  // Changed from Double to Integer to match new API
    public String projectId;  // UUID of the project
    public String projectName; // Project name (new field in API)
    public String assignee;
    
    public String dueDate;
    public String waitUntil;
    
    public List<String> tags = new ArrayList<>();
    public List<TaskAnnotation> annotations = new ArrayList<>();
    // Server uses List<ObjectId>; we model as List<String> IDs for MCP client compatibility
    public List<String> depends = new ArrayList<>();
    
    public String originalInput;
    
    public void start() {
        this.status = TaskStatus.ACTIVE;
        addAnnotation("Task started");
    }
    
    public void stop() {
        if (this.status == TaskStatus.ACTIVE) {
            this.status = TaskStatus.PENDING;
            addAnnotation("Task stopped");
        }
    }
    
    public void done() {
        this.status = TaskStatus.COMPLETED;
        addAnnotation("Task completed");
    }
    
    public void markAsDeleted() {
        this.status = TaskStatus.DELETED;
        addAnnotation("Task deleted");
    }
    
    public void addAnnotation(String description) {
        annotations.add(new TaskAnnotation(LocalDateTime.now(), description));
    }
    
    public boolean isOverdue() {
        if (dueDate == null || status == TaskStatus.COMPLETED) return false;
        try {
            try {
                ZonedDateTime dueZ = ZonedDateTime.parse(dueDate);
                return dueZ.isBefore(ZonedDateTime.now());
            } catch (DateTimeParseException ex) {
                LocalDateTime dueL = LocalDateTime.parse(dueDate);
                return dueL.isBefore(LocalDateTime.now());
            }
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean isDueToday() {
        if (dueDate == null) return false;
        try {
            try {
                ZonedDateTime dueZ = ZonedDateTime.parse(dueDate);
                ZonedDateTime now = ZonedDateTime.now();
                return dueZ.toLocalDate().equals(now.toLocalDate());
            } catch (DateTimeParseException ex) {
                LocalDateTime dueL = LocalDateTime.parse(dueDate);
                return dueL.toLocalDate().equals(LocalDateTime.now().toLocalDate());
            }
        } catch (Exception e) {
            return false;
        }
    }
}
