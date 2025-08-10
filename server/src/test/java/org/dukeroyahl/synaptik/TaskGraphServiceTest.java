package org.dukeroyahl.synaptik;

import io.quarkus.test.junit.QuarkusTest;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.service.TaskGraphService;
import org.dukeroyahl.synaptik.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class TaskGraphServiceTest {

    @Inject
    TaskGraphService taskGraphService;
    
    @Inject
    TaskService taskService;

    @BeforeEach
    void cleanUp() {
        // Clean up tasks before each test
        taskService.deleteAllTasks().await().indefinitely();
    }

    @Test
    void testBuildTaskGraphWithEmptyTasks() {
        // Test building graph with no tasks
        TaskGraphResponse response = taskGraphService.buildTaskGraph(List.of(TaskStatus.PENDING))
            .await().indefinitely();
        
        assertNotNull(response);
        assertTrue(response.nodes().isEmpty());
        assertTrue(response.edges().isEmpty());
        assertFalse(response.hasCycles());
        assertNull(response.centerId());
    }

    @Test
    void testBuildTaskGraphWithSingleTask() {
        // Create a single task
        Task task = new Task();
        task.title = "Test Task";
        task.priority = TaskPriority.HIGH;
        task.status = TaskStatus.PENDING;
        
        Task createdTask = taskService.createTask(task).await().indefinitely();
        
        // Build graph
        TaskGraphResponse response = taskGraphService.buildTaskGraph(List.of(TaskStatus.PENDING))
            .await().indefinitely();
        
        assertNotNull(response);
        assertEquals(1, response.nodes().size());
        assertTrue(response.edges().isEmpty());
        assertFalse(response.hasCycles());
        
        // Verify node details
        assertEquals(createdTask.id.toString(), response.nodes().get(0).id());
        assertEquals("Test Task", response.nodes().get(0).title());
        assertEquals(TaskStatus.PENDING, response.nodes().get(0).status());
    }

    @Test
    void testBuildNeighborsGraphWithNonExistentTask() {
        // Test with a non-existent task ID
        java.util.UUID nonExistentId = java.util.UUID.randomUUID();
        
        TaskGraphResponse response = taskGraphService.buildNeighborsGraph(nonExistentId, 2, true)
            .await().indefinitely();
        
        assertNotNull(response);
        assertTrue(response.nodes().isEmpty());
        assertTrue(response.edges().isEmpty());
        assertFalse(response.hasCycles());
        assertEquals(nonExistentId.toString(), response.centerId());
    }

    @Test
    void testBuildNeighborsGraphWithSingleTask() {
        // Create a single task
        Task task = new Task();
        task.title = "Center Task";
        task.priority = TaskPriority.MEDIUM;
        task.status = TaskStatus.PENDING;
        
        Task createdTask = taskService.createTask(task).await().indefinitely();
        
        // Build neighbors graph
        TaskGraphResponse response = taskGraphService.buildNeighborsGraph(createdTask.id, 2, true)
            .await().indefinitely();
        
        assertNotNull(response);
        assertEquals(1, response.nodes().size());
        assertTrue(response.edges().isEmpty());
        assertFalse(response.hasCycles());
        assertEquals(createdTask.id.toString(), response.centerId());
        
        // Verify node details
        assertEquals(createdTask.id.toString(), response.nodes().get(0).id());
        assertEquals("Center Task", response.nodes().get(0).title());
        assertEquals(TaskStatus.PENDING, response.nodes().get(0).status());
    }

    @Test
    void testTaskGraphServiceInjection() {
        // Verify that TaskGraphService is properly injected
        assertNotNull(taskGraphService);
        assertNotNull(taskService);
    }
}
