package com.synaptik.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
// Collection indexes will be created programmatically or via MongoDB scripts
// import io.quarkus.mongodb.panache.common.CollectionIndex;
// import io.quarkus.mongodb.panache.common.CollectionIndexes;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "projects")
// TODO: Add indexes programmatically or via MongoDB scripts
// Indexes needed:
// - status
// - owner
// - members
// - dueDate + status (overdue projects)
// - progress
// - tags
// - name (unique)
// - createdAt (recent projects)
public class Project extends BaseEntity {
    
    @NotBlank
    @Size(max = 100)
    public String name;
    
    @Size(max = 500)
    public String description;
    
    @NotNull
    public ProjectStatus status = ProjectStatus.PLANNING;
    
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    public Double progress = 0.0;
    
    @Size(max = 50)
    public String color;
    
    public LocalDateTime startDate;
    public LocalDateTime endDate;
    public LocalDateTime dueDate;
    
    public List<String> tags = new ArrayList<>();
    
    @Size(max = 100)
    public String owner;
    
    public List<String> members = new ArrayList<>();
    
    // Mindmap integration
    public String mindmapId;
    
    // Business methods
    public void activate() {
        this.status = ProjectStatus.ACTIVE;
        if (this.startDate == null) {
            this.startDate = LocalDateTime.now();
        }
    }
    
    public void complete() {
        this.status = ProjectStatus.COMPLETED;
        this.progress = 100.0;
        this.endDate = LocalDateTime.now();
    }
    
    public void putOnHold() {
        this.status = ProjectStatus.ON_HOLD;
    }
    
    public void updateProgress(double progress) {
        this.progress = Math.min(100.0, Math.max(0.0, progress));
        if (this.progress >= 100.0) {
            complete();
        }
    }
    
    public boolean isOverdue() {
        return dueDate != null && LocalDateTime.now().isAfter(dueDate) && 
               status != ProjectStatus.COMPLETED;
    }
    
    public long getDaysUntilDue() {
        if (dueDate == null) return Long.MAX_VALUE;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), dueDate);
    }
}