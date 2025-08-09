package org.dukeroyahl.synaptik.domain;

import java.time.LocalDateTime;

public class TaskAnnotation {
    // Align with server domain: field name timestamp and LocalDateTime type
    public LocalDateTime timestamp;
    public String description;
    
    public TaskAnnotation() {}
    
    public TaskAnnotation(LocalDateTime timestamp, String description) {
        this.timestamp = timestamp;
        this.description = description;
    }
}