package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Mindmap;
import org.dukeroyahl.synaptik.domain.MindmapNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class MindmapService {
    
    @Inject
    Logger logger;
    
    public Uni<List<Mindmap>> getAllMindmaps() {
        return Mindmap.listAll();
    }
    
    public Uni<Mindmap> getMindmapById(ObjectId id) {
        return Mindmap.findById(id);
    }
    
    public Uni<Mindmap> createMindmap(Mindmap mindmap) {
        mindmap.prePersist();
        logger.infof("Creating new mindmap: %s", mindmap.title);
        return mindmap.persist();
    }
    
    public Uni<Mindmap> updateMindmap(ObjectId id, Mindmap updates) {
        return Mindmap.<Mindmap>findById(id)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                updateMindmapFields(mindmap, updates);
                mindmap.prePersist();
                logger.infof("Updating mindmap: %s", mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    public Uni<Boolean> deleteMindmap(ObjectId id) {
        return Mindmap.<Mindmap>findById(id)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                logger.infof("Deleting mindmap: %s", mindmap.title);
                return Mindmap.deleteById(id);
            })
            .onItem().ifNull().continueWith(false);
    }
    
    public Uni<Mindmap> duplicateMindmap(ObjectId sourceId, String newTitle, String newOwner) {
        return Mindmap.<Mindmap>findById(sourceId)
            .onItem().ifNotNull().transformToUni(source -> {
                Mindmap duplicate = new Mindmap();
                duplicate.title = newTitle;
                duplicate.owner = newOwner;
                duplicate.description = source.description;
                duplicate.rootNode = source.rootNode; // Simple copy - could be deep copy if needed
                duplicate.tags = source.tags != null ? List.copyOf(source.tags) : null;
                duplicate.canvasWidth = source.canvasWidth;
                duplicate.canvasHeight = source.canvasHeight;
                duplicate.zoom = source.zoom;
                duplicate.panX = source.panX;
                duplicate.panY = source.panY;
                duplicate.isPublic = false; // New mindmap should be private by default
                duplicate.prePersist();
                logger.infof("Duplicating mindmap: %s -> %s", source.title, duplicate.title);
                return duplicate.persist();
            });
    }
    
    public Uni<List<Mindmap>> getMindmapsByOwner(String owner) {
        return Mindmap.<Mindmap>find("owner", owner).list();
    }
    
    public Uni<List<Mindmap>> getMindmapsByCollaborator(String collaborator) {
        return Mindmap.<Mindmap>find("collaborators", collaborator).list();
    }
    
    public Uni<List<Mindmap>> getPublicMindmaps() {
        return Mindmap.<Mindmap>find("isPublic", true).list();
    }
    
    public Uni<List<Mindmap>> getMindmapsByTag(String tag) {
        return Mindmap.<Mindmap>find("tags", tag).list();
    }
    
    public Uni<List<Mindmap>> getAccessibleMindmaps(String userId) {
        // Find mindmaps where user is owner, collaborator, or mindmap is public
        return Mindmap.<Mindmap>find("owner = ?1 or collaborators = ?2 or isPublic = true", userId, userId).list();
    }
    
    public Uni<List<Mindmap>> getTemplates() {
        return Mindmap.<Mindmap>find("isTemplate", true).list();
    }
    
    public Uni<List<Mindmap>> getTemplatesByCategory(String category) {
        return Mindmap.<Mindmap>find("isTemplate = true and templateCategory", category).list();
    }
    
    public Uni<List<Mindmap>> getMindmapsByProjectId(String projectId) {
        return Mindmap.<Mindmap>find("projectId", projectId).list();
    }
    
    public Uni<Mindmap> addCollaborator(ObjectId mindmapId, String collaborator) {
        return Mindmap.<Mindmap>findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.addCollaborator(collaborator);
                mindmap.prePersist();
                logger.infof("Adding collaborator %s to mindmap: %s", collaborator, mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    public Uni<Mindmap> removeCollaborator(ObjectId mindmapId, String collaborator) {
        return Mindmap.<Mindmap>findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.removeCollaborator(collaborator);
                mindmap.prePersist();
                logger.infof("Removing collaborator %s from mindmap: %s", collaborator, mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    public Uni<Mindmap> addNode(ObjectId mindmapId, String parentId, MindmapNode newNode) {
        return Mindmap.<Mindmap>findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.addNode(parentId, newNode);
                mindmap.prePersist();
                logger.infof("Adding node to mindmap: %s", mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    public Uni<Mindmap> removeNode(ObjectId mindmapId, String nodeId) {
        return Mindmap.<Mindmap>findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.removeNode(nodeId);
                mindmap.prePersist();
                logger.infof("Removing node from mindmap: %s", mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    public Uni<Mindmap> updateCanvasSettings(ObjectId mindmapId, Double width, Double height, Double zoom, Double panX, Double panY) {
        return Mindmap.<Mindmap>findById(mindmapId)
            .onItem().ifNotNull().transformToUni(mindmap -> {
                mindmap.updateCanvasSettings(width, height, zoom, panX, panY);
                mindmap.prePersist();
                logger.infof("Updating canvas settings for mindmap: %s", mindmap.title);
                return mindmap.persistOrUpdate();
            });
    }
    
    private void updateMindmapFields(Mindmap mindmap, Mindmap updates) {
        if (updates.title != null) mindmap.title = updates.title;
        if (updates.description != null) mindmap.description = updates.description;
        if (updates.owner != null) mindmap.owner = updates.owner;
        if (updates.isPublic != null) mindmap.isPublic = updates.isPublic;
        if (updates.tags != null) mindmap.tags = updates.tags;
        if (updates.collaborators != null) mindmap.collaborators = updates.collaborators;
        if (updates.rootNode != null) mindmap.rootNode = updates.rootNode;
        if (updates.canvasWidth != null) mindmap.canvasWidth = updates.canvasWidth;
        if (updates.canvasHeight != null) mindmap.canvasHeight = updates.canvasHeight;
        if (updates.zoom != null) mindmap.zoom = updates.zoom;
        if (updates.panX != null) mindmap.panX = updates.panX;
        if (updates.panY != null) mindmap.panY = updates.panY;
        if (updates.allowEdit != null) mindmap.allowEdit = updates.allowEdit;
        if (updates.allowComment != null) mindmap.allowComment = updates.allowComment;
        if (updates.isTemplate != null) mindmap.isTemplate = updates.isTemplate;
        if (updates.templateCategory != null) mindmap.templateCategory = updates.templateCategory;
        if (updates.projectId != null) mindmap.projectId = updates.projectId;
    }
}
