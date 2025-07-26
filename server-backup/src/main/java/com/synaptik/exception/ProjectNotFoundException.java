package com.synaptik.exception;

public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException(String projectId) {
        super("Project not found with ID: " + projectId);
    }
    
    public ProjectNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}