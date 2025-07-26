package com.synaptik.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoEntity;

import java.time.LocalDateTime;

@MongoEntity
public abstract class BaseEntity extends ReactivePanacheMongoEntity {
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
}