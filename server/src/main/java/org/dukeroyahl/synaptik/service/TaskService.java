package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskDTO;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.dto.TaskRequest;
import org.dukeroyahl.synaptik.helper.TaskSearchQueryBuilder;
import org.dukeroyahl.synaptik.mapper.TaskMapper;

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
                .flatMap(tr ->
                        Task.find("_id", tr.id)
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
                        })
                );
    }

//    /**
//     * Update a task with project name (for API use).
//     * This method handles project auto-creation based on project name.
//     */
//    public Uni<Task> updateTaskWithProject(UUID id, Task updates, String projectName) {
//
//
//        return Task.<Task>find("_id", id).firstResult()
//                .onItem().ifNotNull().transformToUni(task -> {
//                    // Handle project update if project name is provided
//                    if (projectName != null && !projectName.trim().isEmpty()) {
//                        return projectService.findOrCreateProject(projectName.trim())
//                                .onItem().transformToUni(project -> {
//                                    if (project != null) {
//                                        task.projectId = project.id;
//                                    }
//                                    return updateTask(updates);
//                                });
//                    } else {
//                        return updateTask(updates);
//                    }
//                });
//    }

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
     * Search tasks with database-level filtering using project UUID only.
     * Uses TaskSearchQueryBuilder helper class for clean separation of concerns.
     *
     * @param statuses  List of task statuses to filter by (optional)
     * @param title     Partial title search (optional, case-insensitive)
     * @param assignee  Partial assignee search (optional, case-insensitive)
     * @param projectId Project UUID for exact matching (optional)
     * @param dateFrom  Start date for due date range filter (optional, ISO format)
     * @param dateTo    End date for due date range filter (optional, ISO format)
     * @param timezone  Timezone for date range filtering (default: UTC)
     * @return List of tasks matching the search criteria
     */
    public Uni<List<Task>> searchTasks(List<TaskStatus> statuses, String title, String assignee,
                                       String projectId, String dateFrom, String dateTo, String timezone) {
        logger.infof("Searching tasks with database-level filters - statuses: %s, title: %s, assignee: %s, projectId: %s, dateFrom: %s, dateTo: %s, timezone: %s",
                statuses, title, assignee, projectId, dateFrom, dateTo, timezone);

        // Use helper class to build MongoDB query
        Document query = queryBuilder.buildSearchQuery(statuses, title, assignee, projectId, dateFrom, dateTo, timezone);

        // Execute database query with filters applied at DB level
        return Task.<Task>find(query).list();
    }
}