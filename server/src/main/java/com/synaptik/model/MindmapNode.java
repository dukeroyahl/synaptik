package com.synaptik.model;

import java.util.ArrayList;
import java.util.List;

public class MindmapNode {
    public String id;
    public String text;
    public String color;
    public String backgroundColor;
    public Double x;
    public Double y;
    public Double width;
    public Double height;
    public String shape;
    public String fontSize;
    public String fontFamily;
    public Boolean bold;
    public Boolean italic;
    public List<String> tags = new ArrayList<>();
    public String notes;
    public String url;
    public String taskId; // Link to task
    public List<MindmapNode> children = new ArrayList<>();
    
    public MindmapNode() {}
    
    public MindmapNode(String id, String text) {
        this.id = id;
        this.text = text;
    }
    
    public void addChild(MindmapNode child) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(child);
    }
    
    public void removeChild(String childId) {
        if (this.children != null) {
            this.children.removeIf(child -> childId.equals(child.id));
        }
    }
    
    public MindmapNode findNode(String nodeId) {
        if (nodeId.equals(this.id)) {
            return this;
        }
        if (this.children != null) {
            for (MindmapNode child : this.children) {
                MindmapNode found = child.findNode(nodeId);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
}