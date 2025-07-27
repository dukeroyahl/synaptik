package org.dukeroyahl.synaptik.domain;

import java.time.LocalDateTime;

public class TaskAnnotation {
    public LocalDateTime timestamp;
    public String description;
    
    public TaskAnnotation() {}
    
    public TaskAnnotation(LocalDateTime timestamp, String description) {
        this.timestamp = timestamp;
        this.description = description;
    }
}