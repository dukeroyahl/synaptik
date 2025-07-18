package com.synaptik.exception;

import jakarta.inject.Inject;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.Set;
import java.util.stream.Collectors;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {
    
    @Inject
    Logger logger;
    
    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ConstraintViolationException) {
            return handleValidationException((ConstraintViolationException) exception);
        }
        
        if (exception instanceof TaskNotFoundException || 
            exception instanceof ProjectNotFoundException || 
            exception instanceof MindmapNotFoundException) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("Resource not found", exception.getMessage()))
                .build();
        }
        
        if (exception instanceof InvalidTaskStateException) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Invalid task state transition", exception.getMessage()))
                .build();
        }
        
        if (exception instanceof DatabaseException) {
            logger.errorf(exception, "Database error occurred: %s", exception.getMessage());
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(new ErrorResponse("Database error", "Service temporarily unavailable"))
                .build();
        }
        
        if (exception instanceof IllegalArgumentException) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Invalid request", exception.getMessage()))
                .build();
        }
        
        // Log the error properly
        logger.errorf(exception, "Unhandled exception: %s", exception.getMessage());
        
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(new ErrorResponse("Internal server error", "An unexpected error occurred"))
            .build();
    }
    
    private Response handleValidationException(ConstraintViolationException ex) {
        Set<ConstraintViolation<?>> violations = ex.getConstraintViolations();
        String errors = violations.stream()
            .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
            .collect(Collectors.joining(", "));
        
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(new ErrorResponse("Validation failed", errors))
            .build();
    }
    
    public static class ErrorResponse {
        public String error;
        public String message;
        
        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }
    }
}