package org.dukeroyahl.synaptik.domain;

public enum ProjectStatus {
    PENDING("pending"),
    STARTED("started"),
    COMPLETED("completed"),
    DELETED("deleted");
    
    private final String value;
    
    ProjectStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}