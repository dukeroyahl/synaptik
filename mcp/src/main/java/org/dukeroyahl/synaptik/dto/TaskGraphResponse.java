package org.dukeroyahl.synaptik.dto;

import java.util.List;

public record TaskGraphResponse(String centerId, List<TaskGraphNode> nodes, List<TaskGraphEdge> edges, boolean hasCycles) {}
