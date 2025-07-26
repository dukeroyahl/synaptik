package org.dukeroyahl.synaptik.repository;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class ProjectRepository implements ReactivePanacheMongoRepository<Project> {
    
    public Uni<List<Project>> findByStatus(ProjectStatus status) {
        return find("status", status)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Project>> findByOwner(String owner) {
        return find("owner", owner)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Project>> findByMember(String member) {
        return find("members", member)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Project>> findOverdueProjects() {
        return find("dueDate < ?1 and status != ?2", 
            LocalDateTime.now(), 
            ProjectStatus.COMPLETED)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Project>> findActiveProjects() {
        return findByStatus(ProjectStatus.ACTIVE);
    }
    
    public Uni<List<Project>> findProjectsByProgressRange(double minProgress, double maxProgress) {
        return find("progress >= ?1 and progress <= ?2", minProgress, maxProgress)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Project>> findProjectsByTag(String tag) {
        return find("tags", tag)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<Project> findByName(String name) {
        return find("name", name).firstResult();
    }
    
    public Uni<Long> countByStatus(ProjectStatus status) {
        return count("status", status);
    }
}