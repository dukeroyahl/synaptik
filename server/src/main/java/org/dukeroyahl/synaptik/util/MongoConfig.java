package org.dukeroyahl.synaptik.util;

import io.quarkus.mongodb.MongoClientName;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import io.quarkus.runtime.StartupEvent;
import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import com.mongodb.MongoClientSettings;
import jakarta.inject.Inject;
import com.mongodb.client.MongoClient;

@ApplicationScoped
public class MongoConfig {

    @Inject
    MongoClient mongoClient;

    public void onStart(@Observes StartupEvent ev) {
        // The codec registration is handled through application.properties
        // This class exists for future MongoDB configuration needs
    }

    public static CodecRegistry createCodecRegistry() {
        return CodecRegistries.fromProviders(new UUIDCodecProvider());
    }
}
