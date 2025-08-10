package org.dukeroyahl.synaptik.domain;

import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoEntityBase;
import org.bson.codecs.pojo.annotations.BsonId;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public abstract class BaseEntity extends ReactivePanacheMongoEntityBase {
    
    @BsonId
    @JsonProperty("id")
    public UUID id;
    
    public LocalDateTime createdAt;
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
}