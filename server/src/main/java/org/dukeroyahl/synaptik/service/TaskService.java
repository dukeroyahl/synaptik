package org.dukeroyahl.synaptik.service;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.repository.TaskRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class TaskService {
    
    @Inject
    TaskRepository taskRepository;
    
    @Inject
    Logger logger;
    
    public Uni<List<Task>> getAllTasks() {
        return taskRepository.listAll();
    }
    
    public Uni<Task> getTaskById(ObjectId id) {
        return taskRepository.findById(id);
    }
    
    public Uni<Task> createTask(Task task) {
        task.prePersist();
        task.urgency = task.calculateUrgency();
        logger.infof("Creating new task: %s", task.title);
        return taskRepository.persist(task);
    }
    
    public Uni<Task> updateTask(ObjectId id, Task updates) {
        return taskRepository.findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                updateTaskFields(task, updates);
                task.urgency = task.calculateUrgency();
                task.prePersist();
                logger.infof("Updating task: %s", task.title);
                return taskRepository.update(task);
            });
    }
    
    public Uni<Boolean> deleteTask(ObjectId id) {
        return taskRepository.deleteById(id);
    }
    
    public Uni<Task> startTask(ObjectId id) {
        return taskRepository.findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.start();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return taskRepository.update(task);
            });
    }
    
    public Uni<Task> stopTask(ObjectId id) {
        return taskRepository.findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.stop();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return taskRepository.update(task);
            });
    }
    
    public Uni<Task> markTaskDone(ObjectId id) {
        return taskRepository.findById(id)
            .onItem().ifNotNull().transformToUni(task -> {
                task.done();
                task.urgency = task.calculateUrgency();
                task.prePersist();
                return taskRepository.update(task);
            });
    }
    
    public Uni<List<Task>> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }
    
    public Uni<List<Task>> getOverdueTasks() {
        return taskRepository.findOverdueTasks();
    }
    
    public Uni<List<Task>> getTodayTasks() {
        return taskRepository.findTodayTasks();
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