package com.synaptik.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/tasks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SecuredTaskResource {

    @Context
    SecurityContext securityContext;

    @Context
    JsonWebToken jwt;

    @GET
    @RolesAllowed({"USER", "ADMIN"})  // Require USER or ADMIN role
    public Response getAllTasks() {
        // Get the current user from JWT
        String currentUser = jwt.getSubject();
        
        // Your existing task logic here
        return Response.ok("Tasks for user: " + currentUser).build();
    }

    @POST
    @RolesAllowed("USER")  // Only users with USER role can create tasks
    public Response createTask(Task task) {
        // Set the task owner to current user
        String currentUser = jwt.getSubject();
        task.setOwner(currentUser);
        
        // Your existing task creation logic here
        return Response.ok(task).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("ADMIN")  // Only admins can delete tasks
    public Response deleteTask(@PathParam("id") String taskId) {
        // Your existing delete logic here
        return Response.ok().build();
    }

    @GET
    @Path("/my-tasks")
    @RolesAllowed("USER")
    public Response getMyTasks() {
        // Get tasks for the current user only
        String currentUser = jwt.getSubject();
        
        // Filter tasks by current user
        // Your existing logic here
        return Response.ok("My tasks for: " + currentUser).build();
    }
}
