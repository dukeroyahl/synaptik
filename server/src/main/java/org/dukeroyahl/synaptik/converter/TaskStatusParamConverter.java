package org.dukeroyahl.synaptik.converter;

import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.ws.rs.ext.ParamConverter;
import jakarta.ws.rs.ext.ParamConverterProvider;
import jakarta.ws.rs.ext.Provider;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;

/**
 * Custom ParamConverter for TaskStatus enum that handles case-insensitive conversion
 * and provides better error handling for invalid status values.
 */
@Provider
public class TaskStatusParamConverter implements ParamConverterProvider {

    @Override
    @SuppressWarnings("unchecked")
    public <T> ParamConverter<T> getConverter(Class<T> rawType, Type genericType, Annotation[] annotations) {
        if (rawType.equals(TaskStatus.class)) {
            return (ParamConverter<T>) new TaskStatusConverter();
        }
        return null;
    }

    private static class TaskStatusConverter implements ParamConverter<TaskStatus> {

        @Override
        public TaskStatus fromString(String value) {
            if (value == null || value.trim().isEmpty()) {
                return null;
            }
            
            try {
                // Handle case-insensitive conversion
                return TaskStatus.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Instead of throwing an exception (which causes 404),
                // we could return null and let the service layer handle it
                // But for API clarity, it's better to throw a clear exception
                throw new IllegalArgumentException("Invalid task status: '" + value + 
                    "'. Valid values are: PENDING, ACTIVE, COMPLETED, DELETED", e);
            }
        }

        @Override
        public String toString(TaskStatus value) {
            return value != null ? value.name() : null;
        }
    }
}
