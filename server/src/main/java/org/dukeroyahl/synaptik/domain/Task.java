package org.dukeroyahl.synaptik.domain;

import io.quarkus.mongodb.panache.common.MongoEntity;
import jakarta.validation.constraints.*;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "tasks")
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
        
        switch (priority) {
            case HIGH -> urgency += 6.0;
            case MEDIUM -> urgency += 3.9;
            case LOW -> urgency += 1.8;
        }
        
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
        
        if (createdAt != null) {
            long ageInDays = java.time.temporal.ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
            urgency += ageInDays * 0.01;
        }
        
        if (status == TaskStatus.ACTIVE) urgency += 4;
        if (status == TaskStatus.WAITING) urgency -= 3;
        
        if (tags.contains("urgent")) urgency += 5;
        if (tags.contains("important")) urgency += 3;
        
        return Math.min(100.0, Math.max(0.0, urgency));
    }
}