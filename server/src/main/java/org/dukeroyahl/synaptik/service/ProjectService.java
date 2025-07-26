package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.repository.ProjectRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class ProjectService {
    
    @Inject
    ProjectRepository projectRepository;
    
    @Inject
    Logger logger;
    
    public Uni<List<Project>> getAllProjects() {
        return projectRepository.listAll();
    }
    
    public Uni<Project> getProjectById(ObjectId id) {
        return projectRepository.findById(id);
    }
    
    public Uni<Project> createProject(Project project) {
        project.prePersist();
        logger.infof("Creating new project: %s", project.name);
        return projectRepository.persist(project);
    }
    
    public Uni<Project> updateProject(ObjectId id, Project updates) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                updateProjectFields(project, updates);
                project.prePersist();
                logger.infof("Updating project: %s", project.name);
                return projectRepository.update(project);
            });
    }
    
    public Uni<Boolean> deleteProject(ObjectId id) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                logger.infof("Deleting project: %s", project.name);
                return projectRepository.deleteById(id);
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<Project> activateProject(ObjectId id) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.activate();
                project.prePersist();
                logger.infof("Activating project: %s", project.name);
                return projectRepository.update(project);
            });
    }
    
    public Uni<Project> completeProject(ObjectId id) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.complete();
                project.prePersist();
                logger.infof("Completing project: %s", project.name);
                return projectRepository.update(project);
            });
    }
    
    public Uni<Project> putProjectOnHold(ObjectId id) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.putOnHold();
                project.prePersist();
                logger.infof("Putting project on hold: %s", project.name);
                return projectRepository.update(project);
            });
    }
    
    public Uni<Project> updateProjectProgress(ObjectId id, double progress) {
        return projectRepository.findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.updateProgress(progress);
                project.prePersist();
                logger.infof("Updating project progress: %s - %.1f%%", project.name, progress);
                return projectRepository.update(project);
            });
    }
    
    public Uni<List<Project>> getProjectsByStatus(ProjectStatus status) {
        return projectRepository.findByStatus(status);
    }
    
    public Uni<List<Project>> getProjectsByOwner(String owner) {
        return projectRepository.findByOwner(owner);
    }
    
    public Uni<List<Project>> getOverdueProjects() {
        return projectRepository.findOverdueProjects();
    }
    
    public Uni<List<Project>> getActiveProjects() {
        return projectRepository.findActiveProjects();
    }
    
    public Uni<List<Project>> getProjectsByTag(String tag) {
        return projectRepository.findProjectsByTag(tag);
    }
    
    private void updateProjectFields(Project project, Project updates) {
        if (updates.name != null) project.name = updates.name;
        if (updates.description != null) project.description = updates.description;
        if (updates.status != null) project.status = updates.status;
        if (updates.progress != null) project.progress = updates.progress;
        if (updates.color != null) project.color = updates.color;
        if (updates.startDate != null) project.startDate = updates.startDate;
        if (updates.endDate != null) project.endDate = updates.endDate;
        if (updates.dueDate != null) project.dueDate = updates.dueDate;
        if (updates.owner != null) project.owner = updates.owner;
        if (updates.mindmapId != null) project.mindmapId = updates.mindmapId;
        if (updates.tags != null) project.tags = updates.tags;
        if (updates.members != null) project.members = updates.members;
    }
}