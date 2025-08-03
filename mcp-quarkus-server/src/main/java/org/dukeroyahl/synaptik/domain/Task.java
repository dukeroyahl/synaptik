package org.dukeroyahl.synaptik.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Simplified Task domain class for MCP server (no MongoDB dependencies)
 */
public class Task {
    
    @JsonProperty("id")
    public String id;
    
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String title;
    public String description;
    public TaskStatus status = TaskStatus.PENDING;
    public TaskPriority priority = TaskPriority.NONE;
    public Double urgency;
    public String project;
    public String assignee;
    public LocalDateTime dueDate;
    public LocalDateTime waitUntil;
    public List<String> tags = new ArrayList<>();
    public List<String> annotations = new ArrayList<>();
    public List<String> depends = new ArrayList<>();
}