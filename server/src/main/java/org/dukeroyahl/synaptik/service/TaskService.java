package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.dukeroyahl.synaptik.dto.TaskGraphResponse;
import org.dukeroyahl.synaptik.dto.TaskGraphNode;
import org.dukeroyahl.synaptik.dto.TaskGraphEdge;

@ApplicationScoped
public class TaskService {
    
    @Inject
    Logger logger;
    
    public Uni<List<Task>> getAllTasks() {
        return Task.listAll();
    }

    public Uni<List<Task>> getTasksByStatuses(List<TaskStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return getAllTasks();
        }
        return Task.<Task>find("status in ?1", statuses).list();
    }
    
    public Uni<Task> getTaskById(ObjectId id) {
        return Task.findById(id);
    }
    
    public Uni<Task> createTask(Task task) {
        task.prePersist();
        task.urgency = task.calculateUrgency();
        logger.infof("Creating new task: %s", task.title);
        return task.persist();
    }
    
    public Uni<Task> updateTask(ObjectId id, Task updates) {
        return Task.<Task>findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                updateTaskFields(task, updates);
                task.urgency = task.calculateUrgency();
                task.prePersist();
                logger.infof("Updating task: %s", task.title);
                return task.persistOrUpdate();
            });
    }
    
    public Uni<Boolean> deleteTask(ObjectId id) {
        return Task.deleteById(id);
    }
    
    public Uni<Task> startTask(ObjectId id) {
        return Task.<Task>findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.start();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return task.persistOrUpdate();
            });
    }
    
    public Uni<Task> stopTask(ObjectId id) {
        return Task.<Task>findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.stop();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return task.persistOrUpdate();
            });
    }
    
    public Uni<Task> markTaskDone(ObjectId id) {
        return Task.<Task>findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.done();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return task.persistOrUpdate();
            });
    }
    
    public Uni<List<Task>> getTasksByStatus(TaskStatus status) {
        return Task.<Task>find("status", status).list();
    }
    
    // waiting tasks use generic getTasksByStatus via resource
    
    public Uni<List<Task>> getOverdueTasks(String tz) {
        ZoneId zone = resolveZone(tz);
        ZonedDateTime now = ZonedDateTime.now(zone);
        List<TaskStatus> statuses = List.of(TaskStatus.PENDING, TaskStatus.STARTED, TaskStatus.WAITING, TaskStatus.COMPLETED);
        return Task.<Task>find("status in ?1", statuses).list()
            .onItem().transform(list -> list.stream()
                .filter(t -> isOverdue(t, now))
                .collect(Collectors.toList()));
    }

    public Uni<List<Task>> getTodayTasks(String tz) {
        ZoneId zone = resolveZone(tz);
        LocalDate today = LocalDate.now(zone);
        List<TaskStatus> statuses = List.of(TaskStatus.PENDING, TaskStatus.STARTED, TaskStatus.WAITING, TaskStatus.COMPLETED);
        return Task.<Task>find("status in ?1", statuses).list()
            .onItem().transform(list -> list.stream()
                .filter(t -> isDueToday(t, today, zone))
                .collect(Collectors.toList()));
    }

    private ZoneId resolveZone(String tz) {
        try {
            if (tz != null && !tz.isBlank()) return ZoneId.of(tz);
        } catch (Exception ignored) {}
        return ZoneId.systemDefault();
    }

    private boolean isOverdue(Task t, ZonedDateTime now) {
        if (t.dueDate == null || t.dueDate.isBlank()) return false;
        ZonedDateTime due = parseDueDate(t.dueDate, now.getZone(), true);
        return due != null && due.isBefore(now);
    }

    private boolean isDueToday(Task t, LocalDate today, ZoneId zone) {
        if (t.dueDate == null || t.dueDate.isBlank()) return false;
        ZonedDateTime due = parseDueDate(t.dueDate, zone, false);
        return due != null && due.toLocalDate().equals(today);
    }

    private ZonedDateTime parseDueDate(String raw, ZoneId zone, boolean endOfDayForDateOnly) {
        try {
            // Try ZonedDateTime first
            return ZonedDateTime.parse(raw);
        } catch (Exception ignored) {}
        try {
            // Try LocalDateTime
            LocalDateTime ldt = LocalDateTime.parse(raw);
            return ldt.atZone(zone);
        } catch (Exception ignored) {}
        try {
            // Try LocalDate
            LocalDate ld = LocalDate.parse(raw);
            if (endOfDayForDateOnly) {
                return ld.atTime(23,59,59,999_000_000).atZone(zone);
            }
            return ld.atStartOfDay(zone);
        } catch (Exception ignored) {}
        return null;
    }
    
    private void updateTaskFields(Task task, Task updates) {
        if (updates.title != null) task.title = updates.title;
        if (updates.description != null) task.description = updates.description;
        if (updates.status != null) task.status = updates.status;
        if (updates.priority != null) task.priority = updates.priority;
        if (updates.project != null) task.project = updates.project;
        if (updates.assignee != null) task.assignee = updates.assignee;
        if (updates.dueDate != null) task.dueDate = updates.dueDate;
        if (updates.waitUntil != null) task.waitUntil = updates.waitUntil;
        if (updates.tags != null) task.tags = updates.tags;
        if (updates.depends != null) task.depends = updates.depends;
    }

    public Uni<TaskGraphResponse> buildTaskGraph(List<TaskStatus> statuses) {
        return getTasksByStatuses(statuses)
            .onItem().transform(list -> {
                Map<String, Task> byId = new HashMap<>();
                list.forEach(t -> byId.put(t.id.toString(), t));

                List<TaskGraphNode> nodes = list.stream().map(t -> new TaskGraphNode(
                    t.id.toString(),
                    t.title,
                    t.status,
                    t.project,
                    t.assignee,
                    t.priority != null ? t.priority.name() : null,
                    t.urgency,
                    false
                )).toList();

                List<TaskGraphEdge> edges = new ArrayList<>();
                Map<String, List<String>> adjacency = new HashMap<>();
                for (Task t : list) {
                    if (t.depends != null) {
                        for (ObjectId depId : t.depends) {
                            String from = depId.toString(); // dependency
                            String to = t.id.toString();     // dependent
                            if (byId.containsKey(from)) {
                                edges.add(new TaskGraphEdge(from, to));
                                adjacency.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
                            }
                        }
                    }
                }

                boolean hasCycles = detectCycles(adjacency);
                return new TaskGraphResponse(null, nodes, edges, hasCycles);
            });
    }

    public Uni<TaskGraphResponse> buildNeighborsGraph(ObjectId centerId) {
        return getTaskById(centerId)
            .onItem().transformToUni(center -> {
                if (center == null) {
                    return Uni.createFrom().item(new TaskGraphResponse(centerId.toString(), List.of(), List.of(), false));
                }

                Uni<List<Task>> dependencyTasksUni = center.depends == null || center.depends.isEmpty()
                    ? Uni.createFrom().item(List.<Task>of())
                    : Task.<Task>find("_id in ?1", center.depends).list();

                Uni<List<Task>> dependentsUni = Task.<Task>find("depends = ?1", centerId).list();

                return Uni.combine().all().unis(dependencyTasksUni, dependentsUni).asTuple().map(tuple -> {
                    List<Task> deps = tuple.getItem1();
                    List<Task> dependents = tuple.getItem2();
                    // Build set of tasks to include
                    Map<String, Task> byId = new HashMap<>();
                    byId.put(center.id.toString(), center);
                    for (Task t : deps) byId.put(t.id.toString(), t);
                    for (Task t : dependents) byId.put(t.id.toString(), t);

                    List<TaskGraphNode> nodes = byId.values().stream().map(t -> new TaskGraphNode(
                        t.id.toString(),
                        t.title,
                        t.status,
                        t.project,
                        t.assignee,
                        t.priority != null ? t.priority.name() : null,
                        t.urgency,
                        false
                    )).toList();

                    // Edges among included tasks
                    List<TaskGraphEdge> edges = new ArrayList<>();
                    Map<String, List<String>> adjacency = new HashMap<>();
                    for (Task t : byId.values()) {
                        if (t.depends != null) {
                            for (ObjectId depId : t.depends) {
                                String from = depId.toString();
                                String to = t.id.toString();
                                if (byId.containsKey(from)) {
                                    edges.add(new TaskGraphEdge(from, to));
                                    adjacency.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
                                }
                            }
                        }
                    }
                    boolean hasCycles = detectCycles(adjacency);
                    return new TaskGraphResponse(centerId.toString(), nodes, edges, hasCycles);
                });
            });
    }

    public Uni<TaskGraphResponse> buildNeighborsGraph(ObjectId centerId, int depth, boolean includePlaceholders) {
        if (depth < 1) depth = 1;
        final int maxDepth = depth;
        return getTaskById(centerId)
            .onItem().transformToUni(center -> {
                if (center == null) {
                    return Uni.createFrom().item(new TaskGraphResponse(centerId.toString(), List.of(), List.of(), false));
                }

                // BFS outward up to depth for both directions (dependencies upstream, dependents downstream)
                Set<ObjectId> visited = new HashSet<>();
                Map<ObjectId, Task> taskMap = new HashMap<>();
                Queue<ObjectId> queue = new ArrayDeque<>();
                Map<ObjectId, Integer> level = new HashMap<>();
                queue.add(center.id);
                level.put(center.id, 0);
                visited.add(center.id);
                taskMap.put(center.id, center);

                Uni<List<Task>> allTasksUni = Task.<Task>listAll();
                return allTasksUni.onItem().transform(all -> {
                    // Index dependents (reverse edges)
                    Map<ObjectId, List<Task>> dependentsIndex = new HashMap<>();
                    for (Task t : all) {
                        if (t.depends != null) {
                            for (ObjectId d : t.depends) {
                                dependentsIndex.computeIfAbsent(d, k -> new ArrayList<>()).add(t);
                            }
                        }
                    }

                    // BFS
                    while (!queue.isEmpty()) {
                        ObjectId current = queue.poll();
                        int lvl = level.getOrDefault(current, 0);
                        if (lvl >= maxDepth) continue;
                        Task currentTask = taskMap.get(current);
                        // Upstream (dependencies)
                        if (currentTask.depends != null) {
                            for (ObjectId dep : currentTask.depends) {
                                if (!visited.contains(dep)) {
                                    Task depTask = findTask(all, dep);
                                    if (depTask != null) {
                                        visited.add(dep);
                                        taskMap.put(dep, depTask);
                                        level.put(dep, lvl + 1);
                                        queue.add(dep);
                                    } else if (includePlaceholders) {
                                        // Track placeholder via dummy map entry with minimal info (left as null, will add node later)
                                        level.put(dep, lvl + 1);
                                        visited.add(dep);
                                    }
                                }
                            }
                        }
                        // Downstream (dependents)
                        for (Task depd : dependentsIndex.getOrDefault(current, List.of())) {
                            if (!visited.contains(depd.id)) {
                                visited.add(depd.id);
                                taskMap.put(depd.id, depd);
                                level.put(depd.id, lvl + 1);
                                queue.add(depd.id);
                            }
                        }
                    }

                    // Build nodes
                    List<TaskGraphNode> nodes = new ArrayList<>();
                    for (ObjectId oid : visited) {
                        Task t = taskMap.get(oid);
                        if (t != null) {
                            nodes.add(new TaskGraphNode(
                                t.id.toString(),
                                t.title,
                                t.status,
                                t.project,
                                t.assignee,
                                t.priority != null ? t.priority.name() : null,
                                t.urgency,
                                false
                            ));
                        } else if (includePlaceholders) {
                            nodes.add(new TaskGraphNode(
                                oid.toString(),
                                "(missing)",
                                null,
                                null,
                                null,
                                null,
                                null,
                                true
                            ));
                        }
                    }

                    // Build edges among included nodes
                    Map<String, List<String>> adjacency = new HashMap<>();
                    List<TaskGraphEdge> edges = new ArrayList<>();
                    for (Task t : taskMap.values()) {
                        if (t.depends != null) {
                            for (ObjectId dep : t.depends) {
                                String from = dep.toString();
                                String to = t.id.toString();
                                if (visited.stream().anyMatch(v -> v.toString().equals(from))) {
                                    edges.add(new TaskGraphEdge(from, to));
                                    adjacency.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
                                }
                            }
                        }
                    }
                    boolean hasCycles = detectCycles(adjacency);
                    return new TaskGraphResponse(centerId.toString(), nodes, edges, hasCycles);
                });
            });
    }

    private Task findTask(List<Task> all, ObjectId id) {
        for (Task t : all) if (t.id.equals(id)) return t; return null;
    }

    private boolean detectCycles(Map<String, List<String>> adjacency) {
        Map<String, String> color = new HashMap<>(); // white, gray, black
        for (String node : adjacency.keySet()) {
            color.put(node, "white");
        }
        for (String node : adjacency.keySet()) {
            if (color.get(node).equals("white")) {
                if (dfsCycle(node, adjacency, color)) return true;
            }
        }
        return false;
    }

    private boolean dfsCycle(String node, Map<String, List<String>> adjacency, Map<String, String> color) {
        color.put(node, "gray");
        for (String next : adjacency.getOrDefault(node, List.of())) {
            String c = color.getOrDefault(next, "white");
            if (c.equals("gray")) return true; // back edge
            if (c.equals("white") && dfsCycle(next, adjacency, color)) return true;
        }
        color.put(node, "black");
        return false;
    }
}