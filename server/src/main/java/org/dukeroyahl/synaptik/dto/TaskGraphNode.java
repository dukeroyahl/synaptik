package org.dukeroyahl.synaptik.dto;

import org.dukeroyahl.synaptik.domain.TaskStatus;

import java.util.UUID;

public record TaskGraphNode(String id, String title, TaskStatus status, UUID projectId, String assignee, String priority, Double urgency, boolean placeholder) {}
