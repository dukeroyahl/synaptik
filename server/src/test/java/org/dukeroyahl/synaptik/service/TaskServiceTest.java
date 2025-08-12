package org.dukeroyahl.synaptik.service;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.junit.jupiter.api.*;

import jakarta.inject.Inject;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TaskServiceTest {

    @Inject
    TaskService taskService;

    @BeforeEach
    void setUp() {
        // Clear all tasks before each test
        Task.deleteAll().await().atMost(Duration.ofSeconds(5));
    }

    @Test
    @Order(1)
    void testCreateTask() {
        TaskRequest request = new TaskRequest();
        request.title = "Service Test Task";
        request.description = "Test task created via service";
        request.priority = TaskPriority.HIGH;
        request.assignee = "Service Test User";
        request.tags = List.of("service", "test");

        TaskDTO result = taskService.createTask(request)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertNotNull(result);
        assertEquals("Service Test Task", result.title);
        assertEquals("Test task created via service", result.description);
        assertEquals(TaskPriority.HIGH, result.priority);
        assertEquals("Service Test User", result.assignee);
        assertEquals(TaskStatus.PENDING, result.status);
        assertEquals(1L, result.version);
        assertNotNull(result.id);
        assertNotNull(result.createdAt);
        assertNotNull(result.updatedAt);
    }

    @Test
    @Order(2)
    void testUpdateTaskStatus() {
        // Create a task
        TaskRequest request = new TaskRequest();
        request.title = "Status Test Task";
        request.description = "Test status updates";
        request.priority = TaskPriority.MEDIUM;
        request.assignee = "Status User";

        TaskDTO created = taskService.createTask(request)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        // Update status
        Boolean result = taskService.updateTaskStatus(created.id, TaskStatus.ACTIVE)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertTrue(result);

        // Verify status was updated
        TaskDTO updated = taskService.getTaskById(created.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertEquals(TaskStatus.ACTIVE, updated.status);
        assertEquals(2L, updated.version); // Version should increment
    }

    @Test
    @Order(3)
    void testLinkTasks() {
        // Create two tasks
        TaskRequest request1 = new TaskRequest();
        request1.title = "Task A";
        request1.description = "Foundation task";
        request1.priority = TaskPriority.HIGH;
        request1.assignee = "User A";

        TaskRequest request2 = new TaskRequest();
        request2.title = "Task B";
        request2.description = "Dependent task";
        request2.priority = TaskPriority.MEDIUM;
        request2.assignee = "User B";

        TaskDTO taskA = taskService.createTask(request1)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        TaskDTO taskB = taskService.createTask(request2)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        // Link Task B to depend on Task A
        Boolean result = taskService.linkTasks(taskB.id, taskA.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertTrue(result);

        // Verify dependencies
        List<TaskDTO> dependencies = taskService.getTaskDependencies(taskB.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertEquals(1, dependencies.size());
        assertEquals(taskA.id, dependencies.get(0).id);
    }

    @Test
    @Order(4)
    void testCircularDependencyPrevention() {
        // Create three tasks
        TaskRequest request1 = new TaskRequest();
        request1.title = "Circular Task A";
        request1.description = "Task A";
        request1.priority = TaskPriority.HIGH;
        request1.assignee = "User A";

        TaskRequest request2 = new TaskRequest();
        request2.title = "Circular Task B";
        request2.description = "Task B";
        request2.priority = TaskPriority.MEDIUM;
        request2.assignee = "User B";

        TaskRequest request3 = new TaskRequest();
        request3.title = "Circular Task C";
        request3.description = "Task C";
        request3.priority = TaskPriority.LOW;
        request3.assignee = "User C";

        TaskDTO taskA = taskService.createTask(request1)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        TaskDTO taskB = taskService.createTask(request2)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        TaskDTO taskC = taskService.createTask(request3)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        // Create chain: A <- B <- C
        taskService.linkTasks(taskB.id, taskA.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5));

        taskService.linkTasks(taskC.id, taskB.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5));

        // Try to create circular dependency: A <- C
        UniAssertSubscriber<Boolean> subscriber = taskService.linkTasks(taskA.id, taskC.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber.awaitFailure(Duration.ofSeconds(5));
        Throwable failure = subscriber.getFailure();
        assertTrue(failure instanceof IllegalArgumentException);
        assertTrue(failure.getMessage().contains("circular dependency"));
    }

    @Test
    @Order(5)
    void testVersionTracking() {
        // Create a task
        TaskRequest request = new TaskRequest();
        request.title = "Version Tracking Task";
        request.description = "Test version increments";
        request.priority = TaskPriority.MEDIUM;
        request.assignee = "Version User";

        TaskDTO created = taskService.createTask(request)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertEquals(1L, created.version);

        // Update task
        TaskRequest updateRequest = new TaskRequest();
        updateRequest.id = created.id;
        updateRequest.title = "Updated Version Tracking Task";
        updateRequest.description = "Updated description";
        updateRequest.priority = TaskPriority.HIGH;
        updateRequest.assignee = "Updated User";

        TaskDTO updated = taskService.updateTask(updateRequest)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertEquals(2L, updated.version);

        // Update status
        taskService.updateTaskStatus(created.id, TaskStatus.ACTIVE)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5));

        TaskDTO statusUpdated = taskService.getTaskById(created.id)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .awaitItem(Duration.ofSeconds(5))
            .getItem();

        assertEquals(3L, statusUpdated.version);
    }
}
