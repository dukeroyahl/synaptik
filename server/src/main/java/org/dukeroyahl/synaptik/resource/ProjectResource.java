package org.dukeroyahl.synaptik.resource;

import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.service.ProjectService;
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

@Path("/api/projects")
@Tag(name = "Projects", description = "Project management operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProjectResource {
    
    @Inject
    ProjectService projectService;
    
    @GET
    @Operation(summary = "Get all projects")
    public Uni<List<Project>> getAllProjects() {
        return projectService.getAllProjects();
    }
    
    @GET
    @Path("/{id}")
    @Operation(summary = "Get project by ID")
    public Uni<Response> getProject(@PathParam("id") String id) {
        return projectService.getProjectById(new ObjectId(id))
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Operation(summary = "Create a new project")
    public Uni<Response> createProject(@Valid Project project) {
        return projectService.createProject(project)
            .onItem().transform(createdProject -> Response.status(Response.Status.CREATED).entity(createdProject).build());
    }
    
    @PUT
    @Path("/{id}")
    @Operation(summary = "Update a project")
    public Uni<Response> updateProject(@PathParam("id") String id, @Valid Project updates) {
        return projectService.updateProject(new ObjectId(id), updates)
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete a project")
    public Uni<Response> deleteProject(@PathParam("id") String id) {
        return projectService.deleteProject(new ObjectId(id))
            .onItem().transform(deleted -> deleted ? 
                Response.noContent().build() : 
                Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/activate")
    @Operation(summary = "Activate a project")
    public Uni<Response> activateProject(@PathParam("id") String id) {
        return projectService.activateProject(new ObjectId(id))
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/complete")
    @Operation(summary = "Complete a project")
    public Uni<Response> completeProject(@PathParam("id") String id) {
        return projectService.completeProject(new ObjectId(id))
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @POST
    @Path("/{id}/hold")
    @Operation(summary = "Put project on hold")
    public Uni<Response> putProjectOnHold(@PathParam("id") String id) {
        return projectService.putProjectOnHold(new ObjectId(id))
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @PUT
    @Path("/{id}/progress")
    @Operation(summary = "Update project progress")
    public Uni<Response> updateProjectProgress(@PathParam("id") String id, @QueryParam("progress") double progress) {
        return projectService.updateProjectProgress(new ObjectId(id), progress)
            .onItem().ifNotNull().transform(project -> Response.ok(project).build())
            .onItem().ifNull().continueWith(Response.status(Response.Status.NOT_FOUND).build());
    }
    
    @GET
    @Path("/status/{status}")
    @Operation(summary = "Get projects by status")
    public Uni<List<Project>> getProjectsByStatus(@PathParam("status") ProjectStatus status) {
        return projectService.getProjectsByStatus(status);
    }
    
    @GET
    @Path("/owner/{owner}")
    @Operation(summary = "Get projects by owner")
    public Uni<List<Project>> getProjectsByOwner(@PathParam("owner") String owner) {
        return projectService.getProjectsByOwner(owner);
    }
    
    @GET
    @Path("/overdue")
    @Operation(summary = "Get overdue projects")
    public Uni<List<Project>> getOverdueProjects() {
        return projectService.getOverdueProjects();
    }
    
    @GET
    @Path("/active")
    @Operation(summary = "Get active projects")
    public Uni<List<Project>> getActiveProjects() {
        return projectService.getActiveProjects();
    }
    
    @GET
    @Path("/tag/{tag}")
    @Operation(summary = "Get projects by tag")
    public Uni<List<Project>> getProjectsByTag(@PathParam("tag") String tag) {
        return projectService.getProjectsByTag(tag);
    }
}