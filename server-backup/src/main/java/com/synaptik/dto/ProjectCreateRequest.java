package com.synaptik.dto;

import com.synaptik.model.Project;
import com.synaptik.model.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectCreateRequest {
    
    @NotBlank
    @Size(max = 100)
    public String name;
    
    @Size(max = 500)
    public String description;
    
    public ProjectStatus status = ProjectStatus.PLANNING;
    
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    public Double progress = 0.0;
    
    @Size(max = 50)
    public String color;
    
    public LocalDateTime startDate;
    public LocalDateTime endDate;
    public LocalDateTime dueDate;
    
    public List<String> tags;
    
    @Size(max = 100)
    public String owner;
    
    public List<String> members;
    
    public String mindmapId;
    
    public Project toProject() {
        Project project = new Project();
        project.name = this.name;
        project.description = this.description;
        project.status = this.status;
        project.progress = this.progress;
        project.color = this.color;
        project.startDate = this.startDate;
        project.endDate = this.endDate;
        project.dueDate = this.dueDate;
        project.owner = this.owner;
        project.mindmapId = this.mindmapId;
        
        if (this.tags != null) {
            project.tags = this.tags;
        }
        if (this.members != null) {
            project.members = this.members;
        }
        
        return project;
    }
}