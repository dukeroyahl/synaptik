package com.synaptik.validation;

import com.synaptik.model.TaskStatus;

public record TaskStateTransition(TaskStatus currentStatus, TaskStatus newStatus) {
}