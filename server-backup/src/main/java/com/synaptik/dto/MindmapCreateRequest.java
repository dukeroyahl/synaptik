package com.synaptik.dto;

import com.synaptik.model.Mindmap;
import com.synaptik.model.MindmapNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class MindmapCreateRequest {
    
    @NotBlank
    @Size(max = 100)
    public String title;
    
    @Size(max = 500)
    public String description;
    
    public MindmapNode rootNode;
    
    @Size(max = 50)
    public String owner;
    
    public List<String> collaborators;
    public List<String> tags;
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
    
    public Mindmap toMindmap() {
        Mindmap mindmap = new Mindmap();
        mindmap.title = this.title;
        mindmap.description = this.description;
        mindmap.rootNode = this.rootNode;
        mindmap.owner = this.owner;
        mindmap.projectId = this.projectId;
        mindmap.canvasWidth = this.canvasWidth;
        mindmap.canvasHeight = this.canvasHeight;
        mindmap.zoom = this.zoom;
        mindmap.panX = this.panX;
        mindmap.panY = this.panY;
        mindmap.isPublic = this.isPublic;
        mindmap.allowEdit = this.allowEdit;
        mindmap.allowComment = this.allowComment;
        mindmap.isTemplate = this.isTemplate;
        mindmap.templateCategory = this.templateCategory;
        
        if (this.collaborators != null) {
            mindmap.collaborators = this.collaborators;
        }
        if (this.tags != null) {
            mindmap.tags = this.tags;
        }
        
        return mindmap;
    }
}