package org.dukeroyahl.synaptik.domain;

import java.time.ZonedDateTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Simplified Task domain class for MCP server
 */
public class Task {
    
    public String id;
    public ZonedDateTime createdAt;
    public ZonedDateTime updatedAt;
    
    public String title;
    public String description;
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    public Double urgency;
    public String project;
    public String assignee;
    
    // Store as string to avoid serialization issues
    public String dueDate;
    public String waitUntil;
    
    public List<String> tags = new ArrayList<>();
    public List<TaskAnnotation> annotations = new ArrayList<>();
    public List<String> depends = new ArrayList<>();
    
    // Store the original user input for reference
    public String originalInput;
    
    public void start() {
        this.status = TaskStatus.ACTIVE;
        addAnnotation("Task started");
    }
    
    public void stop() {
        this.status = TaskStatus.PENDING;
        addAnnotation("Task stopped");
    }
    
    public void done() {
        this.status = TaskStatus.COMPLETED;
        addAnnotation("Task completed");
    }
    
    public void addAnnotation(String description) {
        if (annotations == null) {
            annotations = new ArrayList<>();
        }
        TaskAnnotation annotation = new TaskAnnotation();
        annotation.description = description;
        annotation.createdAt = ZonedDateTime.now();
        annotations.add(annotation);
    }
    
    public boolean isOverdue() {
        if (dueDate == null || status == TaskStatus.COMPLETED) {
            return false;
        }
        
        try {
            ZonedDateTime due = ZonedDateTime.parse(dueDate);
            return due.isBefore(ZonedDateTime.now());
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean isDueToday() {
        if (dueDate == null) {
            return false;
        }
        
        try {
            ZonedDateTime due = ZonedDateTime.parse(dueDate);
            ZonedDateTime now = ZonedDateTime.now();
            return due.toLocalDate().equals(now.toLocalDate());
        } catch (Exception e) {
            return false;
        }
    }
}
