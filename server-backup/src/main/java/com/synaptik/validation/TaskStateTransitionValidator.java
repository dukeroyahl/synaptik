package com.synaptik.validation;

import com.synaptik.model.TaskStatus;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TaskStateTransitionValidator implements ConstraintValidator<ValidTaskStateTransition, TaskStateTransition> {
    
    @Override
    public void initialize(ValidTaskStateTransition constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(TaskStateTransition transition, ConstraintValidatorContext context) {
        if (transition == null || transition.currentStatus() == null || transition.newStatus() == null) {
            return true; // Let other validators handle null validation
        }
        
        TaskStatus current = transition.currentStatus();
        TaskStatus newStatus = transition.newStatus();
        
        // Same status is always valid
        if (current == newStatus) {
            return true;
        }
        
        // Valid transitions based on TaskWarrior semantics
        return switch (current) {
            case PENDING -> newStatus == TaskStatus.ACTIVE || 
                          newStatus == TaskStatus.COMPLETED || 
                          newStatus == TaskStatus.WAITING ||
                          newStatus == TaskStatus.DELETED;
                          
            case ACTIVE -> newStatus == TaskStatus.PENDING || 
                          newStatus == TaskStatus.COMPLETED ||
                          newStatus == TaskStatus.WAITING ||
                          newStatus == TaskStatus.DELETED;
                          
            case WAITING -> newStatus == TaskStatus.PENDING || 
                           newStatus == TaskStatus.ACTIVE ||
                           newStatus == TaskStatus.COMPLETED ||
                           newStatus == TaskStatus.DELETED;
                           
            case COMPLETED -> newStatus == TaskStatus.PENDING || 
                             newStatus == TaskStatus.DELETED;
                             
            case DELETED -> false; // Cannot transition from deleted
        };
    }
}