package org.dukeroyahl.synaptik.domain;

public enum TaskStatus {
    PENDING("pending"),
    WAITING("waiting"),
    ACTIVE("active"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    ON_HOLD("on_hold"),
    DELETED("deleted");
    
    private final String value;
    
    TaskStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}