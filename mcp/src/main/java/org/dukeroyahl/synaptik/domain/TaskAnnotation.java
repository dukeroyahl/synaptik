package org.dukeroyahl.synaptik.domain;

import java.time.ZonedDateTime;

public class TaskAnnotation {
    public ZonedDateTime createdAt;
    public String description;
    
    public TaskAnnotation() {}
    
    public TaskAnnotation(ZonedDateTime createdAt, String description) {
        this.createdAt = createdAt;
        this.description = description;
    }
}