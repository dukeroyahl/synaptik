package org.dukeroyahl.synaptik.domain;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Simplified Mindmap domain class for MCP server
 */
public class Mindmap {
    
    public String id;
    public ZonedDateTime createdAt;
    public ZonedDateTime updatedAt;
    
    public String title;
    public String description;
    public String owner;
    public Boolean isPublic = false;
    public Boolean isTemplate = false;
    public String templateCategory;
    public String projectId;
    
    public List<String> collaborators = new ArrayList<>();
    public List<MindmapNode> nodes = new ArrayList<>();
    
    // Canvas settings
    public Double canvasWidth = 1200.0;
    public Double canvasHeight = 800.0;
    public Double zoom = 1.0;
    public Double panX = 0.0;
    public Double panY = 0.0;
    
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
    
    public void addNode(MindmapNode node) {
        if (nodes == null) {
            nodes = new ArrayList<>();
        }
        nodes.add(node);
    }
    
    public void removeNode(String nodeId) {
        if (nodes != null) {
            nodes.removeIf(node -> nodeId.equals(node.id));
        }
    }
    
    public void updateCanvasSettings(Double width, Double height, Double zoom, Double panX, Double panY) {
        if (width != null) this.canvasWidth = width;
        if (height != null) this.canvasHeight = height;
        if (zoom != null) this.zoom = zoom;
        if (panX != null) this.panX = panX;
        if (panY != null) this.panY = panY;
    }
}
