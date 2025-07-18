package com.synaptik.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
// Collection indexes will be created programmatically or via MongoDB scripts
// import io.quarkus.mongodb.panache.common.CollectionIndex;
// import io.quarkus.mongodb.panache.common.CollectionIndexes;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "mindmaps")
// TODO: Add indexes programmatically or via MongoDB scripts
// Indexes needed:
// - owner
// - collaborators
// - isPublic
// - isTemplate
// - isTemplate + templateCategory
// - projectId
// - tags
// - text search on title + description
// - createdAt (recent mindmaps)
public class Mindmap extends BaseEntity {
    
    @NotBlank
    @Size(max = 100)
    public String title;
    
    @Size(max = 500)
    public String description;
    
    public MindmapNode rootNode;
    
    @Size(max = 50)
    public String owner;
    
    public List<String> collaborators = new ArrayList<>();
    
    public List<String> tags = new ArrayList<>();
    
    // Project integration
    public String projectId;
    
    // Canvas settings
    public Double canvasWidth;
    public Double canvasHeight;
    public Double zoom = 1.0;
    public Double panX = 0.0;
    public Double panY = 0.0;
    
    // Sharing settings
    public Boolean isPublic = false;
    public Boolean allowEdit = false;
    public Boolean allowComment = false;
    
    // Template settings
    public Boolean isTemplate = false;
    public String templateCategory;
    
    // Business methods
    public void addCollaborator(String collaborator) {
        if (collaborators == null) {
            collaborators = new ArrayList<>();
        }
        if (!collaborators.contains(collaborator)) {
            collaborators.add(collaborator);
        }
    }
    
    public void removeCollaborator(String collaborator) {
        if (collaborators != null) {
            collaborators.remove(collaborator);
        }
    }
    
    public boolean hasAccess(String userId) {
        return userId.equals(owner) || 
               (collaborators != null && collaborators.contains(userId)) ||
               isPublic;
    }
    
    public boolean canEdit(String userId) {
        return userId.equals(owner) || 
               (collaborators != null && collaborators.contains(userId) && allowEdit);
    }
    
    public MindmapNode findNode(String nodeId) {
        if (rootNode != null) {
            return rootNode.findNode(nodeId);
        }
        return null;
    }
    
    public void addNode(String parentId, MindmapNode newNode) {
        if (rootNode == null) {
            rootNode = newNode;
        } else {
            MindmapNode parent = findNode(parentId);
            if (parent != null) {
                parent.addChild(newNode);
            }
        }
    }
    
    public void removeNode(String nodeId) {
        if (rootNode != null && rootNode.id.equals(nodeId)) {
            rootNode = null;
        } else {
            removeNodeRecursive(rootNode, nodeId);
        }
    }
    
    private void removeNodeRecursive(MindmapNode node, String nodeId) {
        if (node != null && node.children != null) {
            node.children.removeIf(child -> child.id.equals(nodeId));
            for (MindmapNode child : node.children) {
                removeNodeRecursive(child, nodeId);
            }
        }
    }
    
    public void updateCanvasSettings(Double width, Double height, Double zoom, Double panX, Double panY) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.zoom = zoom != null ? Math.max(0.1, Math.min(5.0, zoom)) : this.zoom;
        this.panX = panX != null ? panX : this.panX;
        this.panY = panY != null ? panY : this.panY;
    }
}