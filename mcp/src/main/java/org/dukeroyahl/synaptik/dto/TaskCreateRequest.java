package org.dukeroyahl.synaptik.dto;

import java.time.LocalDateTime;
import java.util.List;

import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;

/**
 * Simplified TaskCreateRequest DTO for MCP server
 */
public class TaskCreateRequest {
    public String title;
    public String description;
    public TaskStatus status;
    public TaskPriority priority;
    public String project;
    public String assignee;
    public LocalDateTime dueDate;
    public LocalDateTime waitUntil;
    public List<String> tags;
}