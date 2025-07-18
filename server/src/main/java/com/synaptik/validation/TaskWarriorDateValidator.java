package com.synaptik.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class TaskWarriorDateValidator implements ConstraintValidator<ValidTaskWarriorDate, String> {
    
    private static final DateTimeFormatter[] SUPPORTED_FORMATS = {
        DateTimeFormatter.ISO_LOCAL_DATE_TIME,
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd")
    };
    
    @Override
    public void initialize(ValidTaskWarriorDate constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotNull handle null validation
        }
        
        // Try to parse with each supported format
        for (DateTimeFormatter formatter : SUPPORTED_FORMATS) {
            try {
                LocalDateTime.parse(value, formatter);
                return true;
            } catch (DateTimeParseException e) {
                // Try next format
            }
        }
        
        // Also check for relative dates (future enhancement)
        if (isRelativeDate(value)) {
            return true;
        }
        
        return false;
    }
    
    private boolean isRelativeDate(String value) {
        // TaskWarrior-style relative dates like "today", "tomorrow", "1week", etc.
        String lowerValue = value.toLowerCase().trim();
        
        // Common relative dates
        if (lowerValue.matches("(today|tomorrow|yesterday)")) {
            return true;
        }
        
        // Relative patterns like "1week", "2days", "3months"
        if (lowerValue.matches("\\d+\\s*(day|days|week|weeks|month|months|year|years)")) {
            return true;
        }
        
        // Days of week
        if (lowerValue.matches("(monday|tuesday|wednesday|thursday|friday|saturday|sunday)")) {
            return true;
        }
        
        return false;
    }
}