package org.dukeroyahl.synaptik.domain;

import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoEntityBase;
import org.bson.codecs.pojo.annotations.BsonId;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.smallrye.mutiny.Uni;

import java.time.LocalDateTime;
import java.util.UUID;

public abstract class BaseEntity extends ReactivePanacheMongoEntityBase {
    
    @BsonId
    @JsonProperty("id")
    public UUID id;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime updatedAt;
    
    public BaseEntity() {
        this.id = UUID.randomUUID();
    }
    
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public <T extends ReactivePanacheMongoEntityBase> Uni<T> persist() {
        prePersist();
        return (Uni<T>) super.persist();
    }
    
    @Override
    @SuppressWarnings("unchecked") 
    public <T extends ReactivePanacheMongoEntityBase> Uni<T> persistOrUpdate() {
        prePersist();
        return (Uni<T>) super.persistOrUpdate();
    }
}