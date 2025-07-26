package com.synaptik.exception;

public class MindmapNotFoundException extends RuntimeException {
    public MindmapNotFoundException(String mindmapId) {
        super("Mindmap not found with ID: " + mindmapId);
    }
    
    public MindmapNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}