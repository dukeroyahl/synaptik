package com.synaptik.exception;

import com.synaptik.model.TaskStatus;

public class InvalidTaskStateException extends RuntimeException {
    public InvalidTaskStateException(TaskStatus currentStatus, TaskStatus newStatus) {
        super(String.format("Invalid task state transition from %s to %s", currentStatus, newStatus));
    }
    
    public InvalidTaskStateException(String message) {
        super(message);
    }
    
    public InvalidTaskStateException(String message, Throwable cause) {
        super(message, cause);
    }
}