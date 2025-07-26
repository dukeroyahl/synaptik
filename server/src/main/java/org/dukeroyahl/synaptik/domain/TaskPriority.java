package org.dukeroyahl.synaptik.domain;

public enum TaskPriority {
    HIGH("H"),
    MEDIUM("M"),
    LOW("L"),
    NONE("");
    
    private final String value;
    
    TaskPriority(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}