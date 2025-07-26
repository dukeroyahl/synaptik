package org.dukeroyahl.synaptik.resource;

import org.dukeroyahl.synaptik.domain.Mindmap;
import org.dukeroyahl.synaptik.domain.MindmapNode;
import org.dukeroyahl.synaptik.service.MindmapService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/mindmaps")
@Tag(name = "Mindmaps", description = "Mindmap management operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MindmapResource {
    
    @Inject
    MindmapService mindmapService;
    
    @GET
    @Operation(summary = "Get all mindmaps")
    public Uni<List<Mindmap>> getAllMindmaps() {
        return mindmapService.getAllMindmaps();
    }
    
    @GET
    @Path("/{id}")
    @Operation(summary = "Get mindmap by ID")
    public Uni<Response> getMindmap(@PathParam("id") String id) {
        return mindmapService.getMindmapById(new ObjectId(id))
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Operation(summary = "Create a new mindmap")
    public Uni<Response> createMindmap(@Valid Mindmap mindmap) {
        return mindmapService.createMindmap(mindmap)
            .onItem().transform(createdMindmap -> Response.status(Response.Status.CREATED).entity(createdMindmap).build());
    }
    
    @PUT
    @Path("/{id}")
    @Operation(summary = "Update a mindmap")
    public Uni<Response> updateMindmap(@PathParam("id") String id, @Valid Mindmap updates) {
        return mindmapService.updateMindmap(new ObjectId(id), updates)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete a mindmap")
    public Uni<Response> deleteMindmap(@PathParam("id") String id) {
        return mindmapService.deleteMindmap(new ObjectId(id))
            .onItem().transform(deleted -> deleted ? 
                Response.noContent().build() : 
                Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @GET
    @Path("/owner/{owner}")
    @Operation(summary = "Get mindmaps by owner")
    public Uni<List<Mindmap>> getMindmapsByOwner(@PathParam("owner") String owner) {
        return mindmapService.getMindmapsByOwner(owner);
    }
    
    @GET
    @Path("/accessible/{userId}")
    @Operation(summary = "Get accessible mindmaps for user")
    public Uni<List<Mindmap>> getAccessibleMindmaps(@PathParam("userId") String userId) {
        return mindmapService.getAccessibleMindmaps(userId);
    }
    
    @GET
    @Path("/public")
    @Operation(summary = "Get public mindmaps")
    public Uni<List<Mindmap>> getPublicMindmaps() {
        return mindmapService.getPublicMindmaps();
    }
    
    @GET
    @Path("/templates")
    @Operation(summary = "Get mindmap templates")
    public Uni<List<Mindmap>> getTemplates() {
        return mindmapService.getTemplates();
    }
    
    @GET
    @Path("/templates/{category}")
    @Operation(summary = "Get templates by category")
    public Uni<List<Mindmap>> getTemplatesByCategory(@PathParam("category") String category) {
        return mindmapService.getTemplatesByCategory(category);
    }
    
    @GET
    @Path("/project/{projectId}")
    @Operation(summary = "Get mindmaps by project ID")
    public Uni<List<Mindmap>> getMindmapsByProjectId(@PathParam("projectId") String projectId) {
        return mindmapService.getMindmapsByProjectId(projectId);
    }
    
    @POST
    @Path("/{id}/collaborators")
    @Operation(summary = "Add collaborator to mindmap")
    public Uni<Response> addCollaborator(@PathParam("id") String id, @QueryParam("collaborator") String collaborator) {
        return mindmapService.addCollaborator(new ObjectId(id), collaborator)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @DELETE
    @Path("/{id}/collaborators")
    @Operation(summary = "Remove collaborator from mindmap")
    public Uni<Response> removeCollaborator(@PathParam("id") String id, @QueryParam("collaborator") String collaborator) {
        return mindmapService.removeCollaborator(new ObjectId(id), collaborator)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/nodes")
    @Operation(summary = "Add node to mindmap")
    public Uni<Response> addNode(@PathParam("id") String id, @QueryParam("parentId") String parentId, @Valid MindmapNode node) {
        return mindmapService.addNode(new ObjectId(id), parentId, node)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @DELETE
    @Path("/{id}/nodes/{nodeId}")
    @Operation(summary = "Remove node from mindmap")
    public Uni<Response> removeNode(@PathParam("id") String id, @PathParam("nodeId") String nodeId) {
        return mindmapService.removeNode(new ObjectId(id), nodeId)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @PUT
    @Path("/{id}/canvas")
    @Operation(summary = "Update canvas settings")
    public Uni<Response> updateCanvasSettings(@PathParam("id") String id, 
                                            @QueryParam("width") Double width,
                                            @QueryParam("height") Double height,
                                            @QueryParam("zoom") Double zoom,
                                            @QueryParam("panX") Double panX,
                                            @QueryParam("panY") Double panY) {
        return mindmapService.updateCanvasSettings(new ObjectId(id), width, height, zoom, panX, panY)
            .onItem().ifNotNull().transform(mindmap -> Response.ok(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/duplicate")
    @Operation(summary = "Duplicate mindmap")
    public Uni<Response> duplicateMindmap(@PathParam("id") String id, 
                                        @QueryParam("title") String newTitle,
                                        @QueryParam("owner") String newOwner) {
        return mindmapService.duplicateMindmap(new ObjectId(id), newTitle, newOwner)
            .onItem().ifNotNull().transform(mindmap -> Response.status(Response.Status.CREATED).entity(mindmap).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
}