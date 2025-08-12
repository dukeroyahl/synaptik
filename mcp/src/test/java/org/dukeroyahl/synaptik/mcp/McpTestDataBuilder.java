package org.dukeroyahl.synaptik.mcp;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.dukeroyahl.synaptik.domain.ProjectStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Test data builder utilities for MCP tests to reduce duplication
 */
class McpTestDataBuilder {
    
    static class Tasks {
        static TaskBuilder create() {
            return new TaskBuilder();
        }
        
        static Task minimal() {
            return create().id("test-task-id").title("Test Task").build();
        }
        
        static Task completed() {
            return create().id("completed-id").title("Completed Task").status(TaskStatus.COMPLETED).build();
        }
        
        static Task active() {
            return create().id("active-id").title("Active Task").status(TaskStatus.ACTIVE).build();
        }
        
        static Task pending() {
            return create().id("pending-id").title("Pending Task").status(TaskStatus.PENDING).build();
        }
    }
    
    static class Projects {
        static ProjectBuilder create() {
            return new ProjectBuilder();
        }
        
        static Project minimal() {
            return create().id("test-project-id").name("Test Project").build();
        }
        
        static Project started() {
            return create().id("started-id").name("Started Project").status(ProjectStatus.STARTED).build();
        }
        
        static Project completed() {
            return create().id("completed-id").name("Completed Project").status(ProjectStatus.COMPLETED).build();
        }
    }
    
    static class TaskBuilder {
        private Task task = new Task();
        
        TaskBuilder() {
            // Set sensible defaults
            task.id = "default-task-id";
            task.title = "Default Task";
            task.status = TaskStatus.PENDING;
            task.priority = TaskPriority.MEDIUM;
        }
        
        TaskBuilder id(String id) {
            task.id = id;
            return this;
        }
        
        TaskBuilder title(String title) {
            task.title = title;
            return this;
        }
        
        TaskBuilder description(String description) {
            task.description = description;
            return this;
        }
        
        TaskBuilder status(TaskStatus status) {
            task.status = status;
            return this;
        }
        
        TaskBuilder priority(TaskPriority priority) {
            task.priority = priority;
            return this;
        }
        
        TaskBuilder withNullValues() {
            task.priority = null;
            return this;
        }
        
        TaskBuilder withSpecialCharacters() {
            task.title = "Task with émojis 🚀 and spëcial chars & symbols @#$%";
            return this;
        }
        
        TaskBuilder withLongTitle() {
            task.title = "This is a very long task title that might cause formatting issues if not handled properly in the response formatting";
            return this;
        }
        
        Task build() {
            return task;
        }
    }
    
    static class ProjectBuilder {
        private Project project = new Project();
        
        ProjectBuilder() {
            // Set sensible defaults
            project.id = "default-project-id";
            project.name = "Default Project";
            project.status = ProjectStatus.PENDING;
            project.description = "Default description";
            project.owner = "Default Owner";
        }
        
        ProjectBuilder id(String id) {
            project.id = id;
            return this;
        }
        
        ProjectBuilder name(String name) {
            project.name = name;
            return this;
        }
        
        ProjectBuilder status(ProjectStatus status) {
            project.status = status;
            return this;
        }
        
        Project build() {
            return project;
        }
    }
    
    // Constants for commonly used test values
    static final class Constants {
        static final String VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
        static final String TEST_TASK_TITLE = "Integration Test Task";
        static final String TEST_PROJECT_NAME = "Integration Test Project";
        
        // Priority and status icons
        static final String ICON_HIGH_PRIORITY = "🔴";
        static final String ICON_MEDIUM_PRIORITY = "🟡";
        static final String ICON_LOW_PRIORITY = "🟢";
        static final String ICON_NO_PRIORITY = "⚪";
        
        static final String ICON_PENDING = "⏳";
        static final String ICON_ACTIVE = "🔄";
        static final String ICON_COMPLETED = "✅";
    }
    
    /**
     * Utility methods for common test data scenarios
     */
    static class Scenarios {
        static List<Task> allPriorityLevels() {
            return List.of(
                Tasks.create().id("1").title("High Priority Task").priority(TaskPriority.HIGH).build(),
                Tasks.create().id("2").title("Medium Priority Task").priority(TaskPriority.MEDIUM).build(),
                Tasks.create().id("3").title("Low Priority Task").priority(TaskPriority.LOW).build(),
                Tasks.create().id("4").title("No Priority Task").priority(TaskPriority.NONE).build()
            );
        }
        
        static List<Task> allStatusTypes() {
            return List.of(
                Tasks.create().id("1").title("Pending Task").status(TaskStatus.PENDING).build(),
                Tasks.create().id("2").title("Active Task").status(TaskStatus.ACTIVE).build(),
                Tasks.create().id("3").title("Completed Task").status(TaskStatus.COMPLETED).build()
            );
        }
        
        static List<Project> allProjectStatuses() {
            return List.of(
                Projects.create().id("1").name("Pending Project").status(ProjectStatus.PENDING).build(),
                Projects.create().id("2").name("Started Project").status(ProjectStatus.STARTED).build(),
                Projects.create().id("3").name("Completed Project").status(ProjectStatus.COMPLETED).build()
            );
        }
    }
}