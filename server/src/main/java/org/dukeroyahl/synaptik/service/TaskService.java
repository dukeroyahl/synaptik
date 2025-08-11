package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.helper.TaskSearchQueryBuilder;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;
import org.bson.Document;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class TaskService {
    
    @Inject
    Logger logger;
    
    @Inject
    ProjectService projectService;
    
    @Inject
    TaskSearchQueryBuilder queryBuilder;
    
    public Uni<List<Task>> getAllTasks() {
        return Task.<Task>listAll()
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }

    public Uni<List<Task>> getTasksByStatuses(List<TaskStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return getAllTasks();
        }
        return Task.<Task>find("status in ?1", statuses).list()
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }
    
    public Uni<Task> getTaskById(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().transformToUni(this::enrichTaskWithProject);
    }
    
    public Uni<Task> createTask(Task task) {
        task.prePersist();
        task.urgency = task.calculateUrgency();
        logger.infof("Creating new task: %s", task.title);
        return task.persist()
            .onItem().transformToUni(persistedEntity -> {
                Task createdTask = (Task) persistedEntity;
                // Update project status after task creation
                if (createdTask.projectId != null) {
                    return projectService.updateProjectStatusBasedOnTasks(createdTask.projectId)
                        .onItem().transformToUni(project2 -> 
                            enrichTaskWithProject(createdTask)
                        );
                } else {
                    return enrichTaskWithProject(createdTask);
                }
            });
    }
    
    /**
     * Create a task with project name (for API use).
     * This method handles project auto-creation based on project name.
     */
    public Uni<Task> createTaskWithProject(Task task, String projectName) {
        // Handle project auto-creation if project name is provided
        if (projectName != null && !projectName.trim().isEmpty()) {
            return projectService.findOrCreateProject(projectName.trim())
                .onItem().transformToUni(project -> {
                    if (project != null) {
                        task.projectId = project.id;
                    }
                    return createTask(task);
                });
        } else {
            return createTask(task);
        }
    }
    
    public Uni<Task> updateTask(UUID id, Task updates) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                updateTaskFields(task, updates);
                task.urgency = task.calculateUrgency();
                task.prePersist();
                logger.infof("Updating task: %s", task.title);
                return task.persistOrUpdate()
                    .onItem().transformToUni(persistedEntity -> {
                        Task updatedTask = (Task) persistedEntity;
                        // Update project status after task update
                        if (updatedTask.projectId != null) {
                            return projectService.updateProjectStatusBasedOnTasks(updatedTask.projectId)
                                .onItem().transformToUni(proj -> 
                                    enrichTaskWithProject(updatedTask)
                                );
                        } else {
                            return enrichTaskWithProject(updatedTask);
                        }
                    });
            });
    }
    
    /**
     * Update a task with project name (for API use).
     * This method handles project auto-creation based on project name.
     */
    public Uni<Task> updateTaskWithProject(UUID id, Task updates, String projectName) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                // Handle project update if project name is provided
                if (projectName != null && !projectName.trim().isEmpty()) {
                    return projectService.findOrCreateProject(projectName.trim())
                        .onItem().transformToUni(project -> {
                            if (project != null) {
                                task.projectId = project.id;
                            }
                            return updateTask(id, updates);
                        });
                } else {
                    return updateTask(id, updates);
                }
            });
    }
    
    public Uni<Boolean> deleteTask(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                UUID projectId = task.projectId; // Store project ID before deletion
                logger.infof("Deleting task: %s", task.title);
                return task.delete()
                    .onItem().transformToUni(v -> {
                        // Update project status after task deletion
                        if (projectId != null) {
                            return projectService.updateProjectStatusBasedOnTasks(projectId)
                                .onItem().transform(project -> true);
                        } else {
                            return Uni.createFrom().item(true);
                        }
                    });
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<Void> deleteAllTasks() {
        logger.info("Deleting all tasks");
        return Task.deleteAll().replaceWithVoid();
    }
    
    public Uni<Task> startTask(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                task.start();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                
                return task.persistOrUpdate()
                    .onItem().transformToUni(persistedEntity -> {
                        Task updatedTask = (Task) persistedEntity;
                        // Auto-update project status if task belongs to a project
                        if (updatedTask.projectId != null) {
                            return projectService.updateProjectStatusBasedOnTasks(updatedTask.projectId)
                                .onItem().transformToUni(project -> 
                                    enrichTaskWithProject(updatedTask)
                                );
                        } else {
                            return enrichTaskWithProject(updatedTask);
                        }
                    });
            });
    }
    
    public Uni<Task> stopTask(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                task.stop();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                
                return task.persistOrUpdate()
                    .onItem().transformToUni(persistedEntity -> {
                        Task updatedTask = (Task) persistedEntity;
                        // Auto-update project status if task belongs to a project
                        if (updatedTask.projectId != null) {
                            return projectService.updateProjectStatusBasedOnTasks(updatedTask.projectId)
                                .onItem().transformToUni(project -> 
                                    enrichTaskWithProject(updatedTask)
                                );
                        } else {
                            return enrichTaskWithProject(updatedTask);
                        }
                    });
            });
    }
    
    public Uni<Task> markTaskDone(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(task -> {
                task.done();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                
                return task.persistOrUpdate()
                    .onItem().transformToUni(persistedEntity -> {
                        Task updatedTask = (Task) persistedEntity;
                        // Auto-update project status if task belongs to a project
                        if (updatedTask.projectId != null) {
                            return projectService.updateProjectStatusBasedOnTasks(updatedTask.projectId)
                                .onItem().transformToUni(project -> 
                                    enrichTaskWithProject(updatedTask)
                                );
                        } else {
                            return enrichTaskWithProject(updatedTask);
                        }
                    });
            });
    }
    
    public Uni<List<Task>> getTasksByStatus(TaskStatus status) {
        return Task.<Task>find("status", status).list()
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }
    
    public Uni<List<Task>> getOverdueTasks(String tz) {
        ZoneId zone = resolveZone(tz);
        ZonedDateTime now = ZonedDateTime.now(zone);
        List<TaskStatus> statuses = List.of(TaskStatus.PENDING, TaskStatus.ACTIVE, TaskStatus.COMPLETED);
        return Task.<Task>find("status in ?1", statuses).list()
            .onItem().transform(list -> list.stream()
                .filter(t -> isOverdue(t, now))
                .collect(Collectors.toList()))
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }

    public Uni<List<Task>> getTodayTasks(String tz) {
        ZoneId zone = resolveZone(tz);
        LocalDate today = LocalDate.now(zone);
        List<TaskStatus> statuses = List.of(TaskStatus.PENDING, TaskStatus.ACTIVE, TaskStatus.COMPLETED);
        return Task.<Task>find("status in ?1", statuses).list()
            .onItem().transform(list -> list.stream()
                .filter(t -> isDueToday(t, today, zone))
                .collect(Collectors.toList()))
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }

    // Project enrichment methods
    private Uni<Task> enrichTaskWithProject(Task task) {
        if (task == null || task.projectId == null) {
            return Uni.createFrom().item(task);
        }
        
        return projectService.getProjectById(task.projectId)
            .onItem().transform(project -> {
                task.projectDetails = project;
                return task;
            });
    }
    
    private Uni<List<Task>> enrichTasksWithProjects(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Uni.createFrom().item(tasks);
        }
        
        // Get all unique project IDs
        Set<UUID> projectIds = tasks.stream()
            .map(task -> task.projectId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        
        if (projectIds.isEmpty()) {
            return Uni.createFrom().item(tasks);
        }
        
        // Fetch all projects in one query
        return Project.<Project>find("_id in ?1", projectIds).list()
            .onItem().transform(projects -> {
                // Create a map for quick lookup
                Map<UUID, Project> projectMap = projects.stream()
                    .collect(Collectors.toMap(p -> p.id, p -> p));
                
                // Enrich tasks with project details
                tasks.forEach(task -> {
                    if (task.projectId != null) {
                        task.projectDetails = projectMap.get(task.projectId);
                    }
                });
                
                return tasks;
            });
    }

    private ZoneId resolveZone(String tz) {
        try {
            if (tz != null && !tz.isBlank()) return ZoneId.of(tz);
        } catch (Exception ignored) {}
        return ZoneId.systemDefault();
    }

    private boolean isOverdue(Task t, ZonedDateTime now) {
        if (t.dueDate == null || t.dueDate.isBlank()) return false;
        ZonedDateTime due = parseDueDate(t.dueDate, now.getZone(), true);
        return due != null && due.isBefore(now);
    }

    private boolean isDueToday(Task t, LocalDate today, ZoneId zone) {
        if (t.dueDate == null || t.dueDate.isBlank()) return false;
        ZonedDateTime due = parseDueDate(t.dueDate, zone, false);
        return due != null && due.toLocalDate().equals(today);
    }

    private ZonedDateTime parseDueDate(String raw, ZoneId zone, boolean endOfDayForDateOnly) {
        try {
            // Try ZonedDateTime first
            return ZonedDateTime.parse(raw);
        } catch (Exception ignored) {}
        try {
            // Try LocalDateTime
            LocalDateTime ldt = LocalDateTime.parse(raw);
            return ldt.atZone(zone);
        } catch (Exception ignored) {}
        try {
            // Try LocalDate
            LocalDate ld = LocalDate.parse(raw);
            if (endOfDayForDateOnly) {
                return ld.atTime(23,59,59,999_000_000).atZone(zone);
            }
            return ld.atStartOfDay(zone);
        } catch (Exception ignored) {}
        return null;
    }
    
    /**
     * Search tasks with database-level filtering using project UUID only.
     * Uses TaskSearchQueryBuilder helper class for clean separation of concerns.
     * 
     * @param statuses List of task statuses to filter by (optional)
     * @param title Partial title search (optional, case-insensitive)
     * @param assignee Partial assignee search (optional, case-insensitive)
     * @param projectId Project UUID for exact matching (optional)
     * @param dateFrom Start date for due date range filter (optional, ISO format)
     * @param dateTo End date for due date range filter (optional, ISO format)
     * @param timezone Timezone for date range filtering (default: UTC)
     * @return List of tasks matching the search criteria
     */
    public Uni<List<Task>> searchTasks(List<TaskStatus> statuses, String title, String assignee, 
                                      String projectId, String dateFrom, String dateTo, String timezone) {
        logger.infof("Searching tasks with database-level filters - statuses: %s, title: %s, assignee: %s, projectId: %s, dateFrom: %s, dateTo: %s, timezone: %s", 
                    statuses, title, assignee, projectId, dateFrom, dateTo, timezone);
        
        // Use helper class to build MongoDB query
        Document query = queryBuilder.buildSearchQuery(statuses, title, assignee, projectId, dateFrom, dateTo, timezone);
        
        // Execute database query with filters applied at DB level
        return Task.<Task>find(query).list()
            .onItem().transformToUni(this::enrichTasksWithProjects);
    }
    
    private void updateTaskFields(Task task, Task updates) {
        // Note: ID is never updated - UUIDs are immutable
        if (updates.title != null) task.title = updates.title;
        
        // For nullable fields, we need to distinguish between "not provided" vs "explicitly set to null"
        // Since we're using JSON serialization, null values are included in the updates object
        // We'll update these fields even when they're null to allow clearing them
        task.description = updates.description;
        task.assignee = updates.assignee;
        task.dueDate = updates.dueDate;
        task.waitUntil = updates.waitUntil;
        
        // Note: projectId is NOT updated here - it's handled by the project auto-creation logic
        // in the updateTask method above when the client provides a project name
        // Clients should not directly set projectId
        
        // Non-nullable fields should still check for null
        if (updates.status != null) task.status = updates.status;
        if (updates.priority != null) task.priority = updates.priority;
        if (updates.tags != null) task.tags = updates.tags;
        if (updates.depends != null) task.depends = updates.depends;
    }
}