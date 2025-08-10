package org.dukeroyahl.synaptik.util;

import org.bson.codecs.Codec;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.PostConstruct;
import org.jboss.logging.Logger;

import java.util.UUID;

@ApplicationScoped
public class UUIDCodecProvider implements CodecProvider {
    
    private static final Logger logger = Logger.getLogger(UUIDCodecProvider.class);
    
    @PostConstruct
    public void init() {
        logger.info("UUIDCodecProvider initialized as CDI bean");
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Codec<T> get(Class<T> clazz, CodecRegistry registry) {
        if (clazz == UUID.class) {
            logger.debugf("Providing UUIDCodec for class: %s", clazz.getName());
            return (Codec<T>) new UUIDCodec();
        }
        return null;
    }
}
