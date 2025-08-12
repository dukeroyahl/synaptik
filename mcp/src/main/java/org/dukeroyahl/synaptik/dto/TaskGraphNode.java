package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.TaskStatus;

public record TaskGraphNode(String id, String title, TaskStatus status, String project, String assignee, String priority, Double urgency, boolean placeholder) {}
