package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class ProjectService {
    
    @Inject
    Logger logger;
    
    public Uni<List<Project>> getAllProjects() {
        return Project.listAll();
    }
    
    public Uni<Project> getProjectById(ObjectId id) {
        return Project.findById(id);
    }
    
    public Uni<Project> createProject(Project project) {
        project.prePersist();
        logger.infof("Creating new project: %s", project.name);
        return project.persist();
    }
    
    public Uni<Project> updateProject(ObjectId id, Project updates) {
        return Project.<Project>findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                updateProjectFields(project, updates);
                project.prePersist();
                logger.infof("Updating project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Boolean> deleteProject(ObjectId id) {
        return Project.<Project>findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                logger.infof("Deleting project: %s", project.name);
                return Project.deleteById(id);
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<Project> activateProject(ObjectId id) {
        return Project.<Project>findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.activate();
                project.prePersist();
                logger.infof("Activating project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> completeProject(ObjectId id) {
        return Project.<Project>findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.complete();
                project.prePersist();
                logger.infof("Completing project: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> putProjectOnHold(ObjectId id) {
        return Project.<Project>findById(id)
            .onItem().ifNotNull().transformToUni(project -> {
                project.putOnHold();
                project.prePersist();
                logger.infof("Putting project on hold: %s", project.name);
                return project.persistOrUpdate();
            });
    }
    
    public Uni<Project> updateProjectProgress(ObjectId id, double progress) {
        return Project.<Project>findById(id)
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
        return Project.<Project>find("status", ProjectStatus.ACTIVE).list();
    }
    
    public Uni<List<Project>> getProjectsByTag(String tag) {
        return Project.<Project>find("tags", tag).list();
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
        if (updates.tags != null) project.tags = updates.tags;
        if (updates.members != null) project.members = updates.members;
    }
}
