package org.dukeroyahl.synaptik.util;

import org.bson.BsonReader;
import org.bson.BsonType;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.types.ObjectId;

import java.util.UUID;

public class UUIDCodec implements Codec<UUID> {

    @Override
    public UUID decode(BsonReader reader, DecoderContext decoderContext) {
        BsonType bsonType = reader.getCurrentBsonType();
        
        switch (bsonType) {
            case STRING:
                // New UUID format - read as string
                return UUID.fromString(reader.readString());
            case OBJECT_ID:
                // Legacy ObjectId format - convert to UUID
                ObjectId objectId = reader.readObjectId();
                // Convert ObjectId to UUID deterministically
                String hex = objectId.toHexString();
                // ObjectId is 24 chars, pad to 32 chars for UUID format
                String paddedHex = String.format("%32s", hex).replace(' ', '0');
                String formatted = paddedHex.replaceAll(
                    "(\\w{8})(\\w{4})(\\w{4})(\\w{4})(\\w{12})", 
                    "$1-$2-$3-$4-$5"
                );
                return UUID.fromString(formatted);
            default:
                throw new IllegalArgumentException("Cannot decode UUID from BSON type: " + bsonType);
        }
    }

    @Override
    public void encode(BsonWriter writer, UUID value, EncoderContext encoderContext) {
        writer.writeString(value.toString());
    }

    @Override
    public Class<UUID> getEncoderClass() {
        return UUID.class;
    }
}
