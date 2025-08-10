package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.dto.UpdateProject;
import org.dukeroyahl.synaptik.mapper.ProjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ProjectService {
    
    @Inject
    Logger logger;
    
    @Inject
    ProjectMapper projectMapper;
    
    public Uni<List<Project>> getAllProjects() {
        return Project.listAll();
    }
    
    public Uni<Project> getProjectById(UUID id) {
        return Project.find("_id", id).firstResult();
    }
    
    public Uni<Project> getProjectByName(String name) {
        return Project.find("name", name).firstResult();
    }
    
    public Uni<Project> createProject(Project project) {
        project.prePersist();
        logger.infof("Creating new project: %s", project.name);
        return project.persist().map(persistedEntity -> (Project) persistedEntity);
    }
    
    public Uni<Project> findOrCreateProject(String projectName) {
        if (projectName == null || projectName.trim().isEmpty()) {
            return Uni.createFrom().nullItem();
        }
        
        return getProjectByName(projectName.trim())
            .onItem().ifNull().switchTo(() -> {
                Project newProject = new Project();
                newProject.name = projectName.trim();
                newProject.status = ProjectStatus.PENDING;
                logger.infof("Auto-creating project: %s", projectName.trim());
                return createProject(newProject);
            });
    }
    
    public Uni<Project> updateProject(UUID id, UpdateProject updates) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                projectMapper.updateProjectFromRecord(updates, project);
                project.prePersist();
                logger.infof("Updating project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Boolean> hardDeleteProject(UUID id) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                logger.infof("Hard deleting project: %s", project.name);
                return project.delete().map(v -> true);
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<Void> deleteAllProjects() {
        logger.info("Deleting all projects");
        return Project.deleteAll().replaceWithVoid();
    }
    
    public Uni<Project> startProject(UUID id) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                project.start();
                project.prePersist();
                logger.infof("Starting project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> completeProject(UUID id) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                project.complete();
                project.prePersist();
                logger.infof("Completing project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> deleteProject(UUID id) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                project.markAsDeleted();
                project.prePersist();
                logger.infof("Marking project as deleted: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> updateProjectProgress(UUID id, double progress) {
        return Project.<Project>find("_id", id).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                project.updateProgress(progress);
                project.prePersist();
                logger.infof("Updating project progress: %s - %.1f%%", project.name, progress);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<List<Project>> getProjectsByStatus(ProjectStatus status) {
        return Project.<Project>find("status", status).list();
    }
    
    public Uni<List<Project>> getProjectsByOwner(String owner) {
        return Project.<Project>find("owner", owner).list();
    }
    
    public Uni<List<Project>> getOverdueProjects() {
        return Project.<Project>find("dueDate < ?1 and status != ?2", 
            java.time.LocalDateTime.now(), 
            ProjectStatus.COMPLETED).list();
    }
    
    public Uni<List<Project>> getActiveProjects() {
        return Project.<Project>find("status", ProjectStatus.STARTED).list();
    }
    
    public Uni<List<Project>> getProjectsByTag(String tag) {
        return Project.<Project>find("tags", tag).list();
    }
    
    public Uni<Project> updateProjectStatusBasedOnTasks(UUID projectId) {
        return Project.<Project>find("_id", projectId).firstResult()
            .onItem().ifNotNull().transformToUni(project -> {
                // Get all tasks for this project
                return org.dukeroyahl.synaptik.domain.Task.<org.dukeroyahl.synaptik.domain.Task>find("projectId", projectId).list()
                    .onItem().transformToUni(tasks -> {
                        if (tasks.isEmpty()) {
                            // No tasks, keep project in PENDING
                            if (project.status == ProjectStatus.STARTED) {
                                project.status = ProjectStatus.PENDING;
                                project.prePersist();
                                logger.infof("Project %s moved back to PENDING (no tasks)", project.name);
                                return project.persistOrUpdate();
                            }
                            return Uni.createFrom().item(project);
                        }
                        
                        long totalTasks = tasks.size();
                        long completedTasks = tasks.stream()
                            .mapToLong(t -> t.status == org.dukeroyahl.synaptik.domain.TaskStatus.COMPLETED ? 1 : 0)
                            .sum();
                        long activeTasks = tasks.stream()
                            .mapToLong(t -> t.status == org.dukeroyahl.synaptik.domain.TaskStatus.STARTED ? 1 : 0)
                            .sum();
                        
                        // Calculate progress
                        double newProgress = (double) completedTasks / totalTasks * 100.0;
                        project.progress = newProgress;
                        
                        // Update project status based on task states
                        if (completedTasks == totalTasks) {
                            // All tasks completed
                            if (project.status != ProjectStatus.COMPLETED) {
                                project.complete();
                                logger.infof("Project %s auto-completed (all tasks done)", project.name);
                            }
                        } else if (activeTasks > 0) {
                            // At least one task is active
                            if (project.status != ProjectStatus.STARTED) {
                                project.start();
                                logger.infof("Project %s auto-started (active tasks)", project.name);
                            }
                        } else if (completedTasks == 0) {
                            // No completed or active tasks
                            if (project.status == ProjectStatus.STARTED) {
                                project.status = ProjectStatus.PENDING;
                                logger.infof("Project %s moved back to PENDING (no active tasks)", project.name);
                            }
                        }
                        // If some tasks are completed but none are active, keep current status
                        
                        project.prePersist();
                        return project.persistOrUpdate();
                    });
            })
            .onItem().ifNull().switchTo(Uni.createFrom().nullItem());
    }
}
