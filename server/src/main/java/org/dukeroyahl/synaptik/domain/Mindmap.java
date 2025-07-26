package org.dukeroyahl.synaptik.domain;

import io.quarkus.mongodb.panache.common.MongoEntity;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

@MongoEntity(collection = "mindmaps")
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
    
    public String projectId;
    
    public Double canvasWidth;
    public Double canvasHeight;
    public Double zoom = 1.0;
    public Double panX = 0.0;
    public Double panY = 0.0;
    
    public Boolean isPublic = false;
    public Boolean allowEdit = false;
    public Boolean allowComment = false;
    
    public Boolean isTemplate = false;
    public String templateCategory;
    
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