package org.dukeroyahl.synaptik.domain;

public enum TaskStatus {
    PENDING("pending"),
    WAITING("waiting"),
    ACTIVE("active"),
    COMPLETED("completed"),
    DELETED("deleted");
    
    private final String value;
    
    TaskStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}