package org.dukeroyahl.synaptik.mapper;

import io.quarkus.test.junit.QuarkusTest;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.junit.jupiter.api.Test;
import jakarta.inject.Inject;

import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class TaskMapperTest {

    @Inject
    TaskMapper taskMapper;

    @Test
    public void testTaskToDTO() {
        // Create a Task entity
        Task task = new Task();
        task.id = UUID.randomUUID();
        task.title = "Test Task";
        task.description = "Test Description";
        task.status = TaskStatus.PENDING;
        task.priority = TaskPriority.HIGH;
        task.assignee = "Test User";
        task.dueDate = "2025-08-15";
        task.tags = Arrays.asList("test", "mapping");
        task.projectId = UUID.randomUUID();
        
        // Convert to DTO
        TaskDTO dto = taskMapper.toDTO(task);
        
        // Verify mapping
        assertNotNull(dto);
        assertEquals(task.id, dto.id);
        assertEquals(task.title, dto.title);
        assertEquals(task.description, dto.description);
        assertEquals(task.status, dto.status);
        assertEquals(task.priority, dto.priority);
        assertEquals(task.assignee, dto.assignee);
        assertEquals(task.dueDate, dto.dueDate);
        assertEquals(task.tags, dto.tags);
        assertEquals(task.projectId, dto.projectId);
    }



    @Test
    public void testNullHandling() {
        // Test with null values
        Task task = new Task();
        task.id = UUID.randomUUID();
        task.title = "Test Task";
        // Leave other fields null
        
        TaskDTO dto = taskMapper.toDTO(task);
        
        assertNotNull(dto);
        assertEquals(task.id, dto.id);
        assertEquals(task.title, dto.title);
        assertNull(dto.description);
        assertNull(dto.assignee);
        assertNull(dto.dueDate);
    }
}
