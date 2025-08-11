package org.dukeroyahl.synaptik.service;

import io.quarkus.test.junit.QuarkusTest;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import jakarta.inject.Inject;

import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class TaskServiceDueDateTest {

    @Inject
    TaskService taskService;

    @BeforeEach
    public void cleanup() {
        // Clean up tasks before each test
        taskService.deleteAllTasks().await().indefinitely();
    }

    @Test
    public void testGetOverdueTasksUTC() {
        // Create an overdue task (yesterday)
        TaskRequest overdueTask = new TaskRequest();
        overdueTask.title = "Overdue Task";
        overdueTask.description = "This task is overdue";
        overdueTask.status = TaskStatus.PENDING;
        overdueTask.priority = TaskPriority.HIGH;
        overdueTask.projectName = "Test Project";
        overdueTask.assignee = "Test User";
        overdueTask.dueDate = "2025-08-10T10:00:00Z"; // Yesterday

        // Create the task
        taskService.createTask(overdueTask).await().indefinitely();

        // Get overdue tasks
        List<TaskDTO> overdueTasks = taskService.getOverdueTasks("UTC").await().indefinitely();

        // Should find the overdue task
        assertTrue(overdueTasks.size() >= 1);
        assertTrue(overdueTasks.stream().anyMatch(task -> "Overdue Task".equals(task.title)));
    }

    @Test
    public void testGetDueTodayTasksUTC() {
        // Create a task due today
        ZonedDateTime today = ZonedDateTime.now(ZoneId.of("UTC"));
        String todayIso = today.withHour(15).withMinute(0).withSecond(0).toInstant().toString();

        TaskRequest dueTodayTask = new TaskRequest();
        dueTodayTask.title = "Due Today Task";
        dueTodayTask.description = "This task is due today";
        dueTodayTask.status = TaskStatus.PENDING;
        dueTodayTask.priority = TaskPriority.MEDIUM;
        dueTodayTask.projectName = "Test Project";
        dueTodayTask.assignee = "Test User";
        dueTodayTask.dueDate = todayIso;

        // Create the task
        taskService.createTask(dueTodayTask).await().indefinitely();

        // Get due today tasks
        List<TaskDTO> dueTodayTasks = taskService.getDueTodayTasks("UTC").await().indefinitely();

        // Should find the due today task
        assertTrue(dueTodayTasks.size() >= 1);
        assertTrue(dueTodayTasks.stream().anyMatch(task -> "Due Today Task".equals(task.title)));
    }

    @Test
    public void testTimezoneHandling() {
        // Test with different timezones
        List<TaskDTO> utcOverdue = taskService.getOverdueTasks("UTC").await().indefinitely();
        List<TaskDTO> nyOverdue = taskService.getOverdueTasks("America/New_York").await().indefinitely();
        List<TaskDTO> laOverdue = taskService.getOverdueTasks("America/Los_Angeles").await().indefinitely();

        // All should return successfully (even if empty)
        assertNotNull(utcOverdue);
        assertNotNull(nyOverdue);
        assertNotNull(laOverdue);
    }

    @Test
    public void testInvalidTimezone() {
        // Test with invalid timezone - should fallback to UTC
        List<TaskDTO> tasks = taskService.getOverdueTasks("Invalid/Timezone").await().indefinitely();
        
        // Should not throw exception and return a list
        assertNotNull(tasks);
    }

    @Test
    public void testCompletedTasksExcluded() {
        // Create a completed overdue task
        TaskRequest completedTask = new TaskRequest();
        completedTask.title = "Completed Overdue Task";
        completedTask.description = "This completed task should not appear";
        completedTask.status = TaskStatus.COMPLETED;
        completedTask.priority = TaskPriority.LOW;
        completedTask.projectName = "Test Project";
        completedTask.assignee = "Test User";
        completedTask.dueDate = "2025-08-10T10:00:00Z"; // Yesterday

        // Create the task
        taskService.createTask(completedTask).await().indefinitely();

        // Get overdue tasks
        List<TaskDTO> overdueTasks = taskService.getOverdueTasks("UTC").await().indefinitely();

        // Should not include completed tasks
        assertFalse(overdueTasks.stream().anyMatch(task -> "Completed Overdue Task".equals(task.title)));
    }

    @Test
    public void testTasksWithoutDueDateExcluded() {
        // Create a task without due date
        TaskRequest noDueDateTask = new TaskRequest();
        noDueDateTask.title = "No Due Date Task";
        noDueDateTask.description = "This task has no due date";
        noDueDateTask.status = TaskStatus.PENDING;
        noDueDateTask.priority = TaskPriority.MEDIUM;
        noDueDateTask.projectName = "Test Project";
        noDueDateTask.assignee = "Test User";
        // No dueDate set

        // Create the task
        taskService.createTask(noDueDateTask).await().indefinitely();

        // Get overdue and due today tasks
        List<TaskDTO> overdueTasks = taskService.getOverdueTasks("UTC").await().indefinitely();
        List<TaskDTO> dueTodayTasks = taskService.getDueTodayTasks("UTC").await().indefinitely();

        // Should not include tasks without due dates
        assertFalse(overdueTasks.stream().anyMatch(task -> "No Due Date Task".equals(task.title)));
        assertFalse(dueTodayTasks.stream().anyMatch(task -> "No Due Date Task".equals(task.title)));
    }
}
