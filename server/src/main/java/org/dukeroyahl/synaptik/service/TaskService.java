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
}
