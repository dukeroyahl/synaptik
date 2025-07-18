package com.synaptik.model;

public enum ProjectStatus {
    PLANNING("planning"),
    ACTIVE("active"),
    COMPLETED("completed"),
    ON_HOLD("on-hold");
    
    private final String value;
    
    ProjectStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}