package org.dukeroyahl.synaptik.repository;

import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class TaskRepository implements ReactivePanacheMongoRepository<Task> {
    
    public Uni<List<Task>> findByStatus(TaskStatus status) {
        return find("status", status)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Task>> findOverdueTasks() {
        return find("dueDate < ?1 and status in ?2", 
            LocalDateTime.now(), 
            List.of(TaskStatus.PENDING, TaskStatus.ACTIVE))
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Task>> findTodayTasks() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        return find("dueDate >= ?1 and dueDate <= ?2", startOfDay, endOfDay)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Task>> findByProject(String project) {
        return find("project", project)
            .stream()
            .collect()
            .asList();
    }
    
    public Uni<List<Task>> findByAssignee(String assignee) {
        return find("assignee", assignee)
            .stream()
            .collect()
            .asList();
    }
}