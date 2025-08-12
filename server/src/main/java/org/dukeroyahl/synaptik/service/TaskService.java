package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.dukeroyahl.synaptik.helper.TaskSearchQueryBuilder;
import org.dukeroyahl.synaptik.mapper.TaskMapper;
import org.dukeroyahl.synaptik.util.DateTimeHelper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.logging.Log;
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
    TaskMapper taskMapper;

    @Inject
    TaskSearchQueryBuilder queryBuilder;

    public Uni<List<TaskDTO>> getAllTasks() {
        return Task.<Task>listAll()
                .onItem().transformToUni(this::enrichTaskListWithProjects);
    }

    public Uni<List<Task>> getAllRawTasks() {
        return Task.<Task>listAll();
    }

    public Uni<Integer> importTasks(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Uni.createFrom().item(0);
        }

        Log.infof("Starting import of %d tasks", tasks.size());
        
        // Use reactive MongoDB operations to ensure proper async flow
        return persistTasksReactively(tasks);
    }
    
    private Uni<Integer> persistTasksReactively(List<Task> tasks) {
        // Convert all tasks to reactive persist operations
        List<Uni<Task>> persistOperations = tasks.stream()
            .map(this::persistTaskForImport)
            .collect(Collectors.toList());
        
        // Combine all operations and wait for all to complete
        return Uni.combine().all().unis(persistOperations)
            .with(results -> {
                // Count successful persists (non-null results)
                long successCount = results.stream()
                    .filter(result -> result != null)
                    .count();
                Log.infof("Successfully imported %d out of %d tasks", successCount, tasks.size());
                return (int) successCount;
            });
    }
    
    private Uni<Task> persistTaskForImport(Task task) {
        // For imported tasks, we need to preserve their original timestamps and versions
        // Set the task up for import (preserve existing data)
        if (task.createdAt != null && task.updatedAt != null) {
            // Task already has timestamps, preserve them
            // Don't call prePersist as it would overwrite timestamps
        } else {
            // Task doesn't have timestamps, set them now
            task.prePersist();
        }
        
        // Use reactive persist operation
        return task.persist()
            .onItem().transform(persistedTask -> (Task) persistedTask)
            .onFailure().recoverWithItem(throwable -> {
                Log.warnf("Failed to import task %s: %s", task.title, throwable.getMessage());
                return null; // Return null for failed imports
            });
    }
    
    public Uni<List<TaskDTO>> getTasksByStatuses(List<TaskStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return getAllTasks();
        }
        return Task.<Task>find("status in ?1", statuses).list()
                .onItem().transformToUni(this::enrichTaskListWithProjects);
    }

    public Uni<List<Task>> getRawTasksByStatuses(List<TaskStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return getAllRawTasks();
        }
        return Task.<Task>find("status in ?1", statuses).list();
    }

    public Uni<TaskDTO> getTaskById(UUID id) {
        return Task.<Task>find("_id", id).firstResult()
                .onItem().ifNotNull().transform(taskMapper::toDTO)
                .onItem().ifNotNull().transformToUni(task -> {
                    if (task.projectId != null) {
                        return projectService.getProjectById(task.projectId)
                                .onItem().transform(project -> {
                                    task.projectName = project != null ? project.name : null;
                                    return task;
                                });
                    } else {
                        return Uni.createFrom().item(task);
                    }
                });
    }

    public Uni<Task> getRawTaskById(UUID id) {
        return Task.<Task>find("_id", id).firstResult();
    }

    public Uni<TaskDTO> createTask(TaskRequest taskRequest) {
        return enrichTaskRequestWithProject(taskRequest)
                .flatMap(tr -> {
                    // Normalize dates to ISO 8601 format
                    if (tr.dueDate != null) {
                        tr.dueDate = DateTimeHelper.normalizeToIso8601(tr.dueDate, "UTC");
                    }
                    if (tr.waitUntil != null) {
                        tr.waitUntil = DateTimeHelper.normalizeToIso8601(tr.waitUntil, "UTC");
                    }
                    
                    Task task = taskMapper.toEntity(tr);
                    task.urgency = task.calculateUrgency();
                    return task.persist()
                            .map(persistedTask -> {
                                TaskDTO taskDTO = taskMapper.toDTO((Task) persistedTask);
                                taskDTO.projectName = tr.projectName; // Use the project name from enriched request
                                return taskDTO;
                            });
                });
    }

    private Uni<List<TaskDTO>> enrichTaskListWithProjects(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Uni.createFrom().item(List.of());
        }

        // Convert all tasks to DTOs first
        List<TaskDTO> taskDTOs = taskMapper.toDTOList(tasks);
        
        // Get unique project IDs
        Set<UUID> projectIds = taskDTOs.stream()
                .map(dto -> dto.projectId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (projectIds.isEmpty()) {
            return Uni.createFrom().item(taskDTOs);
        }

        // Fetch all projects in one query and create a map
        return Project.<Project>find("_id in ?1", projectIds).list()
                .onItem().transform(projects -> {
                    Map<UUID, String> projectNameMap = projects.stream()
                            .collect(Collectors.toMap(p -> p.id, p -> p.name));
                    
                    // Enrich DTOs with project names
                    taskDTOs.forEach(dto -> {
                        if (dto.projectId != null) {
                            dto.projectName = projectNameMap.get(dto.projectId);
                        }
                    });
                    
                    return taskDTOs;
                });
    }
    
    private Uni<TaskRequest> enrichTaskRequestWithProject(TaskRequest taskRequest) {
        return Uni.createFrom().item(taskRequest)
                .flatMap(tr -> {
                    if (tr.projectId == null && tr.projectName != null && !tr.projectName.trim().isEmpty()) {
                        logger.infof("Selected Project Name: %s. Need to enrich task with project details.", taskRequest.projectName);
                        return projectService
                                .findOrCreateProject(tr.projectName)
                                .onItem().transform(p -> {
                                    tr.projectId = p.id;
                                    return tr;
                                });
                    } else {
                        return Uni.createFrom().item(tr);
                    }
                });
    }

    public Uni<TaskDTO> updateTask(TaskRequest updates) {
        return enrichTaskRequestWithProject(updates)
                .flatMap(tr -> {
                    // Normalize dates to ISO 8601 format
                    if (tr.dueDate != null) {
                        tr.dueDate = DateTimeHelper.normalizeToIso8601(tr.dueDate, "UTC");
                    }
                    if (tr.waitUntil != null) {
                        tr.waitUntil = DateTimeHelper.normalizeToIso8601(tr.waitUntil, "UTC");
                    }
                    
                    return Task.find("_id", tr.id)
                        .firstResult()
                        .onItem().ifNotNull().transform(t -> {
                            return taskMapper.updateEntityFromRequest(updates, (Task) t);
                        })
                        .onItem().ifNotNull().transform(t -> {
                            t.urgency = t.calculateUrgency();
                            return t;
                        })
                        .onItem().ifNotNull().transformToUni(t -> t.persistOrUpdate())
                        .onItem().ifNotNull().transform(t -> {
                            logger.infof("Updating task: %s", ((Task)t).title);
                            return taskMapper.toDTO((Task)t);
                        })
                        .onItem().ifNotNull().transform(t -> {
                            t.projectName = tr.projectName;
                            return t;
                        });
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

    public Uni<Boolean> updateTaskStatus(UUID id, TaskStatus newStatus) {
        Log.infof("Settings Status of Task %s to %s", id , newStatus);
        return Task.<Task>find("_id", id).firstResult()
                .onItem().ifNotNull().transformToUni(task -> {
                    TaskStatus oldStatus = task.status;
                    task.status = newStatus;
                    
                    // Add status change annotation
                    task.addAnnotation("Status changed from " + oldStatus + " to " + newStatus);
                    
                    task.urgency = task.calculateUrgency();

                    return task.persistOrUpdate()
                            .onItem().transformToUni(persistedEntity -> {
                                Task updatedTask = (Task) persistedEntity;
                                // Auto-update project status if task belongs to a project
                                if (updatedTask.projectId != null) {
                                    return projectService.updateProjectStatusBasedOnTasks(updatedTask.projectId)
                                            .onItem().transform(project -> true);
                                } else {
                                    return Uni.createFrom().item(true);
                                }
                            });
                })
                .onItem().ifNull().continueWith(false);
    }

    // Helper method to enrich TaskDTO with project name
    private Uni<TaskDTO> enrichTaskDTOWithProjectName(TaskDTO taskDTO) {
        if (taskDTO == null || taskDTO.projectId == null) {
            return Uni.createFrom().item(taskDTO);
        }

        return projectService.getProjectById(taskDTO.projectId)
                .onItem().transform(project -> {
                    taskDTO.projectName = project != null ? project.name : null;
                    return taskDTO;
                });
    }

    /**
     * Get tasks that are overdue based on user's timezone.
     * A task is overdue if its due date is before the current date/time in the user's timezone.
     * 
     * @param timezone User's timezone (e.g., "America/New_York", "UTC")
     * @return List of overdue tasks as DTOs
     */
    public Uni<List<TaskDTO>> getOverdueTasks(String timezone) {
        logger.infof("Getting overdue tasks for timezone: %s", timezone);
        
        String currentTime = DateTimeHelper.nowInTimezone(timezone);
        
        // Get all tasks with due dates and filter server-side
        Document query = new Document("dueDate", new Document("$ne", null))
            .append("status", new Document("$ne", TaskStatus.COMPLETED.name()));
        
        return Task.<Task>find(query).list()
            .onItem().transform(tasks -> {
                List<Task> overdueTasks = new ArrayList<>();
                
                for (Task task : tasks) {
                    if (DateTimeHelper.isBefore(task.dueDate, currentTime)) {
                        overdueTasks.add(task);
                    }
                }
                
                return overdueTasks;
            })
            .onItem().transformToUni(this::enrichTaskListWithProjects);
    }
    
    /**
     * Get tasks that are due today based on user's timezone.
     * A task is due today if its due date falls within today's date range in the user's timezone.
     * 
     * @param timezone User's timezone (e.g., "America/New_York", "UTC")
     * @return List of tasks due today as DTOs
     */
    public Uni<List<TaskDTO>> getDueTodayTasks(String timezone) {
        logger.infof("Getting tasks due today for timezone: %s", timezone);
        
        ZonedDateTime startOfToday = DateTimeHelper.startOfDayInTimezone(timezone);
        ZonedDateTime endOfToday = DateTimeHelper.endOfDayInTimezone(timezone);
        
        // Get all tasks with due dates and filter server-side
        Document query = new Document("dueDate", new Document("$ne", null))
            .append("status", new Document("$ne", TaskStatus.COMPLETED.name()));
        
        return Task.<Task>find(query).list()
            .onItem().transform(tasks -> {
                List<Task> dueTodayTasks = new ArrayList<>();
                
                for (Task task : tasks) {
                    if (DateTimeHelper.isWithinRange(task.dueDate, startOfToday, endOfToday)) {
                        dueTodayTasks.add(task);
                    }
                }
                
                return dueTodayTasks;
            })
            .onItem().transformToUni(this::enrichTaskListWithProjects);
    }

    public Uni<List<TaskDTO>> searchTasks(List<TaskStatus> statuses, String title, String assignee,
                                       String projectId, String dateFrom, String dateTo, String timezone) {
        logger.infof("Searching tasks with database-level filters - statuses: %s, title: %s, assignee: %s, projectId: %s, dateFrom: %s, dateTo: %s, timezone: %s",
                statuses, title, assignee, projectId, dateFrom, dateTo, timezone);

        // Use helper class to build MongoDB query
        Document query = queryBuilder.buildSearchQuery(statuses, title, assignee, projectId, dateFrom, dateTo, timezone);

        // Execute database query with filters applied at DB level and enrich with projects
        return Task.<Task>find(query).list()
            .onItem().transformToUni(this::enrichTaskListWithProjects);
    }

    public Uni<Boolean> linkTasks(UUID taskId, UUID dependencyId) {
        Log.infof("Linking task %s to depend on task %s", taskId, dependencyId);
        
        // Prevent self-dependency
        if (taskId.equals(dependencyId)) {
            throw new IllegalArgumentException("Task cannot depend on itself");
        }
        
        return Task.<Task>find("_id", taskId).firstResult()
            .onItem().transformToUni(task -> {
                if (task == null) {
                    return Uni.createFrom().item(false);
                }
                
                // Check if dependency task exists
                return Task.<Task>find("_id", dependencyId).firstResult()
                    .onItem().transformToUni(depTask -> {
                        if (depTask == null) {
                            return Uni.createFrom().item(false);
                        }
                        
                        // Check if link already exists
                        if (task.depends.contains(dependencyId)) {
                            Log.infof("Link already exists between tasks %s and %s", taskId, dependencyId);
                            return Uni.createFrom().item(true);
                        }
                        
                        // Check for circular dependencies
                        return checkCircularDependency(dependencyId, taskId)
                            .onItem().transformToUni(hasCircular -> {
                                if (hasCircular) {
                                    throw new IllegalArgumentException("Creating this link would cause a circular dependency");
                                }
                                
                                // Add the dependency
                                task.depends.add(dependencyId);
                                return task.persistOrUpdate()
                                    .onItem().transform(persistedTask -> true);
                            });
                    });
            });
    }
    
    public Uni<Boolean> unlinkTasks(UUID taskId, UUID dependencyId) {
        Log.infof("Unlinking task %s from dependency %s", taskId, dependencyId);
        
        return Task.<Task>find("_id", taskId).firstResult()
            .onItem().transformToUni(task -> {
                if (task == null) {
                    return Uni.createFrom().item(false);
                }
                
                // Remove the dependency if it exists
                boolean removed = task.depends.remove(dependencyId);
                if (!removed) {
                    Log.infof("No link found between tasks %s and %s", taskId, dependencyId);
                    return Uni.createFrom().item(false);
                }
                
                return task.persistOrUpdate()
                    .onItem().transform(persistedTask -> true);
            });
    }
    
    public Uni<List<TaskDTO>> getTaskDependencies(UUID taskId) {
        Log.infof("Getting dependencies for task %s", taskId);
        
        return Task.<Task>find("_id", taskId).firstResult()
            .onItem().transformToUni(task -> {
                if (task == null) {
                    return Uni.createFrom().nullItem();
                }
                
                if (task.depends.isEmpty()) {
                    return Uni.createFrom().item(new ArrayList<>());
                }
                
                // Find all dependency tasks
                return Task.<Task>find("_id in ?1", task.depends).list()
                    .onItem().transformToUni(this::enrichTaskListWithProjects);
            });
    }
    
    public Uni<List<TaskDTO>> getTaskDependents(UUID taskId) {
        Log.infof("Getting dependents for task %s", taskId);
        
        // Find all tasks that have this task in their depends list
        return Task.<Task>find("depends", taskId).list()
            .onItem().transformToUni(this::enrichTaskListWithProjects);
    }
    
    private Uni<Boolean> checkCircularDependency(UUID startTaskId, UUID targetTaskId) {
        return checkCircularDependencyRecursive(startTaskId, targetTaskId, new HashSet<>());
    }
    
    private Uni<Boolean> checkCircularDependencyRecursive(UUID currentTaskId, UUID targetTaskId, Set<UUID> visited) {
        if (visited.contains(currentTaskId)) {
            // Already visited this task, no circular dependency in this path
            return Uni.createFrom().item(false);
        }
        
        if (currentTaskId.equals(targetTaskId)) {
            // Found the target task, circular dependency detected
            return Uni.createFrom().item(true);
        }
        
        visited.add(currentTaskId);
        
        return Task.<Task>find("_id", currentTaskId).firstResult()
            .onItem().transformToUni(task -> {
                if (task == null || task.depends.isEmpty()) {
                    return Uni.createFrom().item(false);
                }
                
                // Check all dependencies of current task
                List<Uni<Boolean>> checks = task.depends.stream()
                    .map(depId -> checkCircularDependencyRecursive(depId, targetTaskId, new HashSet<>(visited)))
                    .collect(Collectors.toList());
                
                // If any check returns true, we have a circular dependency
                return Uni.combine().all().unis(checks).with(results -> {
                    return results.stream().anyMatch(result -> (Boolean) result);
                });
            });
    }
}
