package com.synaptik.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.mongodb.panache.common.MongoEntity;
// Collection indexes will be created programmatically or via MongoDB scripts
// import io.quarkus.mongodb.panache.common.CollectionIndex;
// import io.quarkus.mongodb.panache.common.CollectionIndexes;
import jakarta.validation.constraints.*;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "tasks")
// TODO: Add indexes programmatically or via MongoDB scripts
// Indexes needed:
// - status + urgency (most common)
// - status + priority + urgency  
// - assignee + status + urgency
// - project + status + urgency
// - dueDate + status
// - tags + status
// - text search on title, description, project, assignee
public class Task extends BaseEntity {
    
    @NotBlank
    @Size(max = 200)
    public String title;
    
    @Size(max = 1000)
    public String description;
    
    @NotNull
    public TaskStatus status = TaskStatus.PENDING;
    
    @NotNull
    public TaskPriority priority = TaskPriority.NONE;
    
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    public Double urgency;
    
    public String project;
    public String assignee;
    public LocalDateTime dueDate;
    public LocalDateTime waitUntil;
    
    public List<String> tags = new ArrayList<>();
    public List<TaskAnnotation> annotations = new ArrayList<>();
    public List<ObjectId> depends = new ArrayList<>();
    
    // Business methods
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
    
    public double calculateUrgency() {
        double urgency = 0.0;
        
        // Priority component
        switch (priority) {
            case HIGH -> urgency += 6.0;
            case MEDIUM -> urgency += 3.9;
            case LOW -> urgency += 1.8;
        }
        
        // Due date component
        if (dueDate != null) {
            LocalDateTime now = LocalDateTime.now();
            long daysUntilDue = java.time.temporal.ChronoUnit.DAYS.between(now, dueDate);
            
            if (daysUntilDue < 0) {
                urgency += 12 + Math.abs(daysUntilDue) * 0.2;
            } else if (daysUntilDue <= 7) {
                urgency += 12 - (daysUntilDue * 1.4);
            } else if (daysUntilDue <= 14) {
                urgency += 5 - (daysUntilDue * 0.3);
            }
        }
        
        // Age component
        if (createdAt != null) {
            long ageInDays = java.time.temporal.ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
            urgency += ageInDays * 0.01;
        }
        
        // Status boost
        if (status == TaskStatus.ACTIVE) urgency += 4;
        if (status == TaskStatus.WAITING) urgency -= 3;
        
        // Tags boost
        if (tags.contains("urgent")) urgency += 5;
        if (tags.contains("important")) urgency += 3;
        
        return Math.min(100.0, Math.max(0.0, urgency));
    }
}