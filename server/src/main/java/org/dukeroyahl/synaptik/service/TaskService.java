package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class TaskService {
    
    @Inject
    Logger logger;
    
    public Uni<List<Task>> getAllTasks() {
        return Task.listAll();
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
    
    public Uni<List<Task>> getOverdueTasks() {
        return Task.<Task>find("dueDate < ?1 and status in ?2", 
            LocalDateTime.now(), 
            List.of(TaskStatus.PENDING, TaskStatus.ACTIVE)).list();
    }
    
    public Uni<List<Task>> getTodayTasks() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        return Task.<Task>find("dueDate >= ?1 and dueDate <= ?2", startOfDay, endOfDay).list();
    }
    
    public Uni<List<Task>> getTasksByProject(String project) {
        return Task.<Task>find("project", project).list();
    }
    
    public Uni<List<Task>> getTasksByAssignee(String assignee) {
        return Task.<Task>find("assignee", assignee).list();
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
}