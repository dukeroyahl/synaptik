package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.ProjectStatus;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Record for updating Project entities.
 * Simplified version without Lombok annotations for MCP compatibility.
 */
public record UpdateProject(
    String name,
    String description,
    ProjectStatus status,
    Double progress,
    String color,
    LocalDateTime startDate,
    LocalDateTime endDate,
    LocalDateTime dueDate,
    List<String> tags,
    String owner,
    List<String> members
) {}
