package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.dto.TaskGraphNode;
import org.dukeroyahl.synaptik.dto.TaskGraphEdge;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;
import org.bson.types.ObjectId;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class responsible for task graph operations including:
 * - Building task dependency graphs
 * - Neighbor graph construction
 * - Cycle detection
 * - Graph node and edge creation
 */
@ApplicationScoped
public class TaskGraphService {
    
    @Inject
    Logger logger;
    
    @Inject
    TaskService taskService;
    
    /**
     * Build a complete task graph for tasks with specified statuses.
     * 
     * @param statuses List of task statuses to include in the graph
     * @return TaskGraphResponse containing nodes, edges, and cycle detection result
     */
    public Uni<TaskGraphResponse> buildTaskGraph(List<TaskStatus> statuses) {
        logger.infof("Building task graph for statuses: %s", statuses);
        
        return taskService.getTasksByStatuses(statuses)
            .onItem().transform(tasks -> {
                List<TaskGraphNode> nodes = new ArrayList<>();
                List<TaskGraphEdge> edges = new ArrayList<>();
                Set<String> processedIds = new HashSet<>();
                
                // Create nodes for all tasks
                for (Task task : tasks) {
                    String taskId = task.id.toString();
                    nodes.add(createTaskGraphNode(task, false));
                    processedIds.add(taskId);
                    
                    // Create edges for dependencies
                    for (ObjectId depId : task.depends) {
                        String depIdStr = depId.toString();
                        edges.add(new TaskGraphEdge(depIdStr, taskId));
                        
                        // Create placeholder nodes for dependencies not in the current task list
                        if (!processedIds.contains(depIdStr)) {
                            nodes.add(new TaskGraphNode(depIdStr, "Unknown Task", TaskStatus.PENDING, 
                                null, null, "NONE", 0.0, true));
                            processedIds.add(depIdStr);
                        }
                    }
                }
                
                boolean hasCycles = detectCycles(nodes, edges);
                logger.infof("Task graph built with %d nodes, %d edges, cycles detected: %s", 
                    nodes.size(), edges.size(), hasCycles);
                
                return new TaskGraphResponse(null, nodes, edges, hasCycles);
            });
    }
    
    /**
     * Build a neighbors graph centered around a specific task.
     * 
     * @param taskId The center task ID
     * @param depth Maximum depth to traverse from the center task
     * @param includePlaceholders Whether to include placeholder nodes for missing dependencies
     * @return TaskGraphResponse containing the neighbor graph
     */
    public Uni<TaskGraphResponse> buildNeighborsGraph(UUID taskId, int depth, boolean includePlaceholders) {
        logger.infof("Building neighbors graph for task %s with depth %d", taskId, depth);
        
        return taskService.getTaskById(taskId)
            .onItem().ifNotNull().transformToUni(centerTask -> {
                return taskService.getAllTasks()
                    .onItem().transform(allTasks -> {
                        List<TaskGraphNode> nodes = new ArrayList<>();
                        List<TaskGraphEdge> edges = new ArrayList<>();
                        Set<String> processedIds = new HashSet<>();
                        
                        String centerTaskId = taskId.toString();
                        
                        // Add center task
                        nodes.add(createTaskGraphNode(centerTask, false));
                        processedIds.add(centerTaskId);
                        
                        // Build task lookup map
                        Map<String, Task> taskMap = allTasks.stream()
                            .collect(Collectors.toMap(t -> t.id.toString(), t -> t));
                        
                        // Add neighbors recursively
                        addNeighbors(centerTask, allTasks, taskMap, nodes, edges, processedIds, 
                                   depth, includePlaceholders);
                        
                        boolean hasCycles = detectCycles(nodes, edges);
                        logger.infof("Neighbors graph built with %d nodes, %d edges, cycles detected: %s", 
                            nodes.size(), edges.size(), hasCycles);
                        
                        return new TaskGraphResponse(centerTaskId, nodes, edges, hasCycles);
                    });
            })
            .onItem().ifNull().continueWith(() -> {
                logger.warnf("Task %s not found for neighbors graph", taskId);
                return new TaskGraphResponse(taskId.toString(), List.of(), List.of(), false);
            });
    }
    
    /**
     * Create a TaskGraphNode from a Task entity.
     * 
     * @param task The task to convert
     * @param placeholder Whether this is a placeholder node
     * @return TaskGraphNode representation
     */
    private TaskGraphNode createTaskGraphNode(Task task, boolean placeholder) {
        String projectName = task.projectDetails != null ? task.projectDetails.name : null;
        return new TaskGraphNode(
            task.id.toString(),
            task.title,
            task.status,
            projectName,
            task.assignee,
            task.priority.toString(),
            task.urgency,
            placeholder
        );
    }
    
    /**
     * Recursively add neighbors (dependencies and dependents) to the graph.
     * 
     * @param centerTask The current center task
     * @param allTasks All available tasks
     * @param taskMap Task lookup map
     * @param nodes List of nodes to add to
     * @param edges List of edges to add to
     * @param processedIds Set of already processed task IDs
     * @param depth Remaining depth to traverse
     * @param includePlaceholders Whether to include placeholder nodes
     */
    private void addNeighbors(Task centerTask, List<Task> allTasks, Map<String, Task> taskMap,
                             List<TaskGraphNode> nodes, List<TaskGraphEdge> edges, 
                             Set<String> processedIds, int depth, boolean includePlaceholders) {
        if (depth <= 0) return;
        
        String centerTaskId = centerTask.id.toString();
        
        // Add dependencies (tasks this task depends on)
        for (ObjectId depId : centerTask.depends) {
            String depIdStr = depId.toString();
            edges.add(new TaskGraphEdge(depIdStr, centerTaskId));
            
            if (!processedIds.contains(depIdStr)) {
                Task depTask = taskMap.get(depIdStr);
                if (depTask != null) {
                    nodes.add(createTaskGraphNode(depTask, false));
                    processedIds.add(depIdStr);
                    // Recursively add neighbors of this dependency
                    addNeighbors(depTask, allTasks, taskMap, nodes, edges, processedIds, 
                               depth - 1, includePlaceholders);
                } else if (includePlaceholders) {
                    nodes.add(new TaskGraphNode(depIdStr, "Unknown Task", TaskStatus.PENDING, 
                        null, null, "NONE", 0.0, true));
                    processedIds.add(depIdStr);
                }
            }
        }
        
        // Add dependents (tasks that depend on this task)
        for (Task task : allTasks) {
            String taskIdStr = task.id.toString();
            if (!processedIds.contains(taskIdStr) && 
                task.depends.contains(new ObjectId(centerTaskId))) {
                
                edges.add(new TaskGraphEdge(centerTaskId, taskIdStr));
                nodes.add(createTaskGraphNode(task, false));
                processedIds.add(taskIdStr);
                
                // Recursively add neighbors of this dependent
                addNeighbors(task, allTasks, taskMap, nodes, edges, processedIds, 
                           depth - 1, includePlaceholders);
            }
        }
    }
    
    /**
     * Detect cycles in the task graph using DFS.
     * 
     * @param nodes List of graph nodes
     * @param edges List of graph edges
     * @return true if cycles are detected, false otherwise
     */
    private boolean detectCycles(List<TaskGraphNode> nodes, List<TaskGraphEdge> edges) {
        // Build adjacency list
        Map<String, List<String>> graph = new HashMap<>();
        for (TaskGraphNode node : nodes) {
            graph.put(node.id(), new ArrayList<>());
        }
        for (TaskGraphEdge edge : edges) {
            graph.computeIfAbsent(edge.from(), k -> new ArrayList<>()).add(edge.to());
        }
        
        // DFS-based cycle detection
        Set<String> visited = new HashSet<>();
        Set<String> recursionStack = new HashSet<>();
        
        for (String nodeId : graph.keySet()) {
            if (!visited.contains(nodeId)) {
                if (hasCycleDFS(nodeId, graph, visited, recursionStack)) {
                    logger.warnf("Cycle detected in task graph starting from node: %s", nodeId);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * DFS helper method for cycle detection.
     * 
     * @param nodeId Current node ID
     * @param graph Adjacency list representation
     * @param visited Set of visited nodes
     * @param recursionStack Set of nodes in current recursion stack
     * @return true if cycle is found, false otherwise
     */
    private boolean hasCycleDFS(String nodeId, Map<String, List<String>> graph, 
                               Set<String> visited, Set<String> recursionStack) {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        List<String> neighbors = graph.get(nodeId);
        if (neighbors != null) {
            for (String neighbor : neighbors) {
                if (!visited.contains(neighbor)) {
                    if (hasCycleDFS(neighbor, graph, visited, recursionStack)) {
                        return true;
                    }
                } else if (recursionStack.contains(neighbor)) {
                    return true;
                }
            }
        }
        
        recursionStack.remove(nodeId);
        return false;
    }
}
