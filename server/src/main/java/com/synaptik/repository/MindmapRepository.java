package com.synaptik.repository;

import com.synaptik.model.Mindmap;
import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class MindmapRepository implements ReactivePanacheMongoRepository<Mindmap> {
    
    public Uni<List<Mindmap>> findByOwner(String owner) {
        return find("owner", owner)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findByCollaborator(String collaborator) {
        return find("collaborators", collaborator)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findAccessibleMindmaps(String userId) {
        return find("owner = ?1 or collaborators = ?1 or isPublic = true", userId)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findPublicMindmaps() {
        return find("isPublic", true)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findTemplates() {
        return find("isTemplate", true)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findTemplatesByCategory(String category) {
        return find("isTemplate = true and templateCategory = ?1", category)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findByProjectId(String projectId) {
        return find("projectId", projectId)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> findByTag(String tag) {
        return find("tags", tag)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Mindmap>> searchByTitle(String titleQuery) {
        return find("title", titleQuery)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<Long> countByOwner(String owner) {
        return count("owner", owner);
    }
    
    public Uni<Long> countPublicMindmaps() {
        return count("isPublic", true);
    }
}