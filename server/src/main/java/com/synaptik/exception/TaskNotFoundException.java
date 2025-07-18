package com.synaptik.exception;

public class TaskNotFoundException extends RuntimeException {
    public TaskNotFoundException(String taskId) {
        super("Task not found with ID: " + taskId);
    }
    
    public TaskNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}