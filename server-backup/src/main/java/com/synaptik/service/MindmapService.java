package com.synaptik.service;

import com.synaptik.model.Mindmap;
import com.synaptik.model.MindmapNode;
import com.synaptik.repository.MindmapRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class MindmapService {
    
    @Inject
    MindmapRepository mindmapRepository;
    
    @Inject
    Logger logger;
    
    public Uni<List<Mindmap>> getAllMindmaps() {
        return mindmapRepository.listAll();
    }
    
    public Uni<Mindmap> getMindmapById(ObjectId id) {
        return mindmapRepository.findById(id);
    }
    
    public Uni<Mindmap> createMindmap(Mindmap mindmap) {
        mindmap.prePersist();
        logger.infof("Creating new mindmap: %s", mindmap.title);
        return mindmapRepository.persist(mindmap);
    }
    
    public Uni<Mindmap> updateMindmap(ObjectId id, Mindmap updates) {
        return mindmapRepository.findById(id)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                updateMindmapFields(mindmap, updates);
                mindmap.prePersist();
                logger.infof("Updating mindmap: %s", mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Boolean> deleteMindmap(ObjectId id) {
        return mindmapRepository.findById(id)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                logger.infof("Deleting mindmap: %s", mindmap.title);
                return mindmapRepository.deleteById(id);
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<List<Mindmap>> getMindmapsByOwner(String owner) {
        return mindmapRepository.findByOwner(owner);
    }
    
    public Uni<List<Mindmap>> getAccessibleMindmaps(String userId) {
        return mindmapRepository.findAccessibleMindmaps(userId);
    }
    
    public Uni<List<Mindmap>> getPublicMindmaps() {
        return mindmapRepository.findPublicMindmaps();
    }
    
    public Uni<List<Mindmap>> getTemplates() {
        return mindmapRepository.findTemplates();
    }
    
    public Uni<List<Mindmap>> getTemplatesByCategory(String category) {
        return mindmapRepository.findTemplatesByCategory(category);
    }
    
    public Uni<List<Mindmap>> getMindmapsByProjectId(String projectId) {
        return mindmapRepository.findByProjectId(projectId);
    }
    
    public Uni<Mindmap> addCollaborator(ObjectId mindmapId, String collaborator) {
        return mindmapRepository.findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.addCollaborator(collaborator);
                mindmap.prePersist();
                logger.infof("Adding collaborator %s to mindmap: %s", collaborator, mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Mindmap> removeCollaborator(ObjectId mindmapId, String collaborator) {
        return mindmapRepository.findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.removeCollaborator(collaborator);
                mindmap.prePersist();
                logger.infof("Removing collaborator %s from mindmap: %s", collaborator, mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Mindmap> addNode(ObjectId mindmapId, String parentId, MindmapNode newNode) {
        return mindmapRepository.findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.addNode(parentId, newNode);
                mindmap.prePersist();
                logger.infof("Adding node to mindmap: %s", mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Mindmap> removeNode(ObjectId mindmapId, String nodeId) {
        return mindmapRepository.findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.removeNode(nodeId);
                mindmap.prePersist();
                logger.infof("Removing node from mindmap: %s", mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Mindmap> updateCanvasSettings(ObjectId mindmapId, Double width, Double height, 
                                           Double zoom, Double panX, Double panY) {
        return mindmapRepository.findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.updateCanvasSettings(width, height, zoom, panX, panY);
                mindmap.prePersist();
                logger.infof("Updating canvas settings for mindmap: %s", mindmap.title);
                return mindmapRepository.update(mindmap);
            });
    }
    
    public Uni<Mindmap> duplicateMindmap(ObjectId sourceId, String newTitle, String newOwner) {
        return mindmapRepository.findById(sourceId)
            .onItem().ifNotNull().transformToUni(source -> {
                Mindmap duplicate = new Mindmap();
                duplicate.title = newTitle;
                duplicate.description = source.description;
                duplicate.rootNode = source.rootNode; // Deep copy would be better
                duplicate.owner = newOwner;
                duplicate.tags = source.tags != null ? List.copyOf(source.tags) : null;
                duplicate.canvasWidth = source.canvasWidth;
                duplicate.canvasHeight = source.canvasHeight;
                duplicate.zoom = source.zoom;
                duplicate.panX = source.panX;
                duplicate.panY = source.panY;
                duplicate.prePersist();
                
                logger.infof("Duplicating mindmap: %s -> %s", source.title, newTitle);
                return mindmapRepository.persist(duplicate);
            });
    }
    
    private void updateMindmapFields(Mindmap mindmap, Mindmap updates) {
        if (updates.title != null) mindmap.title = updates.title;
        if (updates.description != null) mindmap.description = updates.description;
        if (updates.rootNode != null) mindmap.rootNode = updates.rootNode;
        if (updates.owner != null) mindmap.owner = updates.owner;
        if (updates.collaborators != null) mindmap.collaborators = updates.collaborators;
        if (updates.tags != null) mindmap.tags = updates.tags;
        if (updates.projectId != null) mindmap.projectId = updates.projectId;
        if (updates.canvasWidth != null) mindmap.canvasWidth = updates.canvasWidth;
        if (updates.canvasHeight != null) mindmap.canvasHeight = updates.canvasHeight;
        if (updates.zoom != null) mindmap.zoom = updates.zoom;
        if (updates.panX != null) mindmap.panX = updates.panX;
        if (updates.panY != null) mindmap.panY = updates.panY;
        if (updates.isPublic != null) mindmap.isPublic = updates.isPublic;
        if (updates.allowEdit != null) mindmap.allowEdit = updates.allowEdit;
        if (updates.allowComment != null) mindmap.allowComment = updates.allowComment;
        if (updates.isTemplate != null) mindmap.isTemplate = updates.isTemplate;
        if (updates.templateCategory != null) mindmap.templateCategory = updates.templateCategory;
    }
}