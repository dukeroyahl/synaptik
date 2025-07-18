package com.synaptik.validation;

import org.bson.types.ObjectId;
import java.util.List;

public record TaskDependencyCheck(ObjectId taskId, List<ObjectId> dependencies) {
}