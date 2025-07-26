package com.synaptik.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.bson.types.ObjectId;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class NoCyclicDependencyValidator implements ConstraintValidator<NoCyclicDependency, TaskDependencyCheck> {
    
    @Override
    public void initialize(NoCyclicDependency constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(TaskDependencyCheck dependencyCheck, ConstraintValidatorContext context) {
        if (dependencyCheck == null || dependencyCheck.taskId() == null || dependencyCheck.dependencies() == null) {
            return true; // Let other validators handle null validation
        }
        
        ObjectId taskId = dependencyCheck.taskId();
        List<ObjectId> dependencies = dependencyCheck.dependencies();
        
        // Check for direct self-dependency
        if (dependencies.contains(taskId)) {
            return false;
        }
        
        // Check for indirect cycles (simplified - in real implementation, 
        // you'd need to query the database to check the full dependency chain)
        return !hasCycle(taskId, dependencies, new HashSet<>());
    }
    
    private boolean hasCycle(ObjectId taskId, List<ObjectId> dependencies, Set<ObjectId> visited) {
        if (visited.contains(taskId)) {
            return true; // Cycle detected
        }
        
        visited.add(taskId);
        
        // In a real implementation, you'd need to:
        // 1. Query the database to get dependencies for each dependency
        // 2. Recursively check each dependency chain
        // For now, we'll do a simple check
        
        for (ObjectId dependency : dependencies) {
            if (dependency.equals(taskId)) {
                return true;
            }
            // In real implementation, get dependencies of 'dependency' and recurse
        }
        
        visited.remove(taskId);
        return false;
    }
}