package org.dukeroyahl.synaptik.domain;

public enum TaskStatus {
    PENDING("pending"),
    WAITING("waiting"),
    ACTIVE("active"),
    COMPLETED("completed"),
    DELETED("deleted"); // Removed CANCELLED, ON_HOLD to match server domain
    
    private final String value;
    
    TaskStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}