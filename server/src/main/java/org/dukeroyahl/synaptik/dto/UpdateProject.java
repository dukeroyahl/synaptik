package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.ProjectStatus;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.Builder;
import lombok.With;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Record for updating Project entities with Lombok and MapStruct support.
 * Uses @Builder for flexible construction and @With for immutable updates.
 * Mapping is handled by ProjectMapper using MapStruct.
 */
@Builder
@With
public record UpdateProject(
    @Size(max = 100, message = "Project name cannot exceed 100 characters")
    String name,
    
    @Size(max = 500, message = "Project description cannot exceed 500 characters")
    String description,
    
    ProjectStatus status,
    
    @DecimalMin(value = "0.0", message = "Progress cannot be negative")
    @DecimalMax(value = "100.0", message = "Progress cannot exceed 100%")
    Double progress,
    
    @Size(max = 50, message = "Color cannot exceed 50 characters")
    String color,
    
    LocalDateTime startDate,
    LocalDateTime endDate,
    LocalDateTime dueDate,
    
    List<String> tags,
    
    @Size(max = 100, message = "Owner cannot exceed 100 characters")
    String owner,
    
    List<String> members
) {
    // All mapping logic is now handled by ProjectMapper using MapStruct
}
