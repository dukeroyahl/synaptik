package org.dukeroyahl.synaptik.domain;

import io.quarkus.mongodb.panache.reactive.ReactivePanacheMongoEntityBase;
import org.bson.codecs.pojo.annotations.BsonId;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.smallrye.mutiny.Uni;

import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.UUID;

public abstract class BaseEntity extends ReactivePanacheMongoEntityBase {
    
    @BsonId
    @JsonProperty("id")
    public UUID id;
    
    // Store as ISO 8601 string with timezone: "2025-08-11T14:30:00Z" or "2025-08-11T10:30:00-04:00"
    public String createdAt;
    public String updatedAt;
    
    public BaseEntity() {
        this.id = UUID.randomUUID();
    }
    
    public void prePersist() {
        // Use ISO 8601 format with UTC timezone: "2025-08-11T14:30:00Z"
        String now = ZonedDateTime.now(ZoneId.of("UTC")).format(java.time.format.DateTimeFormatter.ISO_INSTANT);
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