package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectCreateRequest {
    
    @NotBlank
    @Size(max = 100)
    public String name;
    
    @Size(max = 500)
    public String description;
    
    public ProjectStatus status = ProjectStatus.PLANNING;
    
    @Size(max = 50)
    public String color;
    
    public LocalDateTime startDate;
    public LocalDateTime endDate;
    public LocalDateTime dueDate;
    
    public List<String> tags;
    
    @Size(max = 100)
    public String owner;
    
    public List<String> members;
    
    public Project toProject() {
        Project project = new Project();
        project.name = this.name;
        project.description = this.description;
        project.status = this.status;
        project.color = this.color;
        project.startDate = this.startDate;
        project.endDate = this.endDate;
        project.dueDate = this.dueDate;
        project.owner = this.owner;
        if (this.tags != null) {
            project.tags = this.tags;
        }
        if (this.members != null) {
            project.members = this.members;
        }
        return project;
    }
}