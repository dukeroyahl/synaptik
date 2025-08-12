package org.dukeroyahl.synaptik;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.dto.UpdateProject;
import org.dukeroyahl.synaptik.mapper.ProjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class UpdateProjectTest {

    @Inject
    ProjectMapper projectMapper;

    @BeforeEach
    void cleanUp() {
        // Clean up projects before each test
        given()
            .when().delete("/api/projects")
            .then().statusCode(204);
    }

    @Test
    void testUpdateProjectRecord() {
        // Test Lombok @Builder functionality
        UpdateProject update = UpdateProject.builder()
            .name("Updated Project Name")
            .description("Updated description")
            .status(ProjectStatus.STARTED)
            .progress(75.0)
            .owner("John Doe")
            .tags(List.of("urgent", "backend"))
            .build();

        assertNotNull(update);
        assertEquals("Updated Project Name", update.name());
        assertEquals("Updated description", update.description());
        assertEquals(ProjectStatus.STARTED, update.status());
        assertEquals(75.0, update.progress());
        assertEquals("John Doe", update.owner());
        assertEquals(List.of("urgent", "backend"), update.tags());
    }

    @Test
    void testUpdateProjectWithMethod() {
        // Test Lombok @With functionality
        UpdateProject original = UpdateProject.builder()
            .name("Original Name")
            .description("Original description")
            .build();

        UpdateProject updated = original
            .withName("New Name")
            .withDescription("New description")
            .withStatus(ProjectStatus.COMPLETED);

        assertEquals("New Name", updated.name());
        assertEquals("New description", updated.description());
        assertEquals(ProjectStatus.COMPLETED, updated.status());
        
        // Original should be unchanged (immutable)
        assertEquals("Original Name", original.name());
        assertEquals("Original description", original.description());
        assertNull(original.status());
    }

    @Test
    void testPartialUpdateHelpersWithMapStruct() {
        // Test the MapStruct helper methods
        UpdateProject nameUpdate = projectMapper.createNameUpdate("New Name");
        assertEquals("New Name", nameUpdate.name());
        assertNull(nameUpdate.description());

        UpdateProject descriptionUpdate = projectMapper.createDescriptionUpdate("New Description");
        assertEquals("New Description", descriptionUpdate.description());
        assertNull(descriptionUpdate.name());

        UpdateProject progressUpdate = projectMapper.createProgressUpdate(90.0);
        assertEquals(90.0, progressUpdate.progress());
        assertNull(progressUpdate.status());
    }

    @Test
    void testApplyToProjectWithMapStruct() {
        // Create a project
        Project project = new Project();
        project.name = "Original Name";
        project.description = "Original description";
        project.status = ProjectStatus.PENDING;
        project.progress = 0.0;

        // Create update record
        UpdateProject update = UpdateProject.builder()
            .name("Updated Name")
            .progress(50.0)
            .owner("Jane Doe")
            .build();

        // Apply update using MapStruct
        projectMapper.updateProjectFromRecord(update, project);

        // Verify updates were applied
        assertEquals("Updated Name", project.name);
        assertEquals("Original description", project.description); // Should remain unchanged
        assertEquals(ProjectStatus.PENDING, project.status); // Should remain unchanged
        assertEquals(50.0, project.progress);
        assertEquals("Jane Doe", project.owner);
    }

    @Test
    void testFromProjectWithMapStruct() {
        // Create a project
        Project project = new Project();
        project.name = "Test Project";
        project.description = "Test description";
        project.status = ProjectStatus.STARTED;
        project.progress = 25.0;
        project.owner = "Test Owner";
        project.tags = List.of("test", "demo");

        // Create UpdateProject from existing project using MapStruct
        UpdateProject update = projectMapper.fromProject(project);

        assertEquals(project.name, update.name());
        assertEquals(project.description, update.description());
        assertEquals(project.status, update.status());
        assertEquals(project.progress, update.progress());
        assertEquals(project.owner, update.owner());
        assertEquals(project.tags, update.tags());
    }

    @Test
    void testToProjectWithMapStruct() {
        // Create update record
        UpdateProject update = UpdateProject.builder()
            .name("MapStruct Project")
            .description("Created via MapStruct")
            .status(ProjectStatus.STARTED)
            .progress(30.0)
            .owner("MapStruct User")
            .build();

        // Convert to Project using MapStruct
        Project project = projectMapper.toProject(update);

        assertEquals(update.name(), project.name);
        assertEquals(update.description(), project.description);
        assertEquals(update.status(), project.status);
        assertEquals(update.progress(), project.progress);
        assertEquals(update.owner(), project.owner);
        
        // ID should be generated automatically by Project constructor
        assertNotNull(project.id);
    }

    @Test
    void testUpdateProjectViaAPI() {
        // First create a project
        Project project = new Project();
        project.name = "API Test Project";
        project.description = "Original description";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Create update using UpdateProject record
        UpdateProject update = UpdateProject.builder()
            .name("Updated API Project")
            .description("Updated description via API")
            .status(ProjectStatus.STARTED)
            .progress(30.0)
            .owner("API User")
            .build();

        // Update via API
        given()
            .contentType(ContentType.JSON)
            .body(update)
            .when().put("/api/projects/" + projectId)
            .then()
            .statusCode(200)
            .body("name", equalTo("Updated API Project"))
            .body("description", equalTo("Updated description via API"))
            .body("status", equalTo("STARTED"))
            .body("progress", equalTo(30.0f))
            .body("owner", equalTo("API User"));
    }

    @Test
    void testPartialUpdateViaAPI() {
        // First create a project
        Project project = new Project();
        project.name = "Partial Update Test";
        project.description = "Original description";
        project.owner = "Original Owner";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Partial update - only update name and progress
        UpdateProject partialUpdate = UpdateProject.builder()
            .name("Partially Updated Project")
            .progress(60.0)
            .build();

        // Update via API
        given()
            .contentType(ContentType.JSON)
            .body(partialUpdate)
            .when().put("/api/projects/" + projectId)
            .then()
            .statusCode(200)
            .body("name", equalTo("Partially Updated Project"))
            .body("description", equalTo("Original description")) // Should remain unchanged
            .body("progress", equalTo(60.0f))
            .body("owner", equalTo("Original Owner")); // Should remain unchanged
    }

    @Test
    void testMapStructIntegrationEndToEnd() {
        // Create initial project
        Project originalProject = new Project();
        originalProject.name = "Original Project";
        originalProject.description = "Original description";
        originalProject.status = ProjectStatus.PENDING;
        originalProject.progress = 0.0;
        originalProject.owner = "Original Owner";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(originalProject)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Create UpdateProject using builder pattern
        UpdateProject update = UpdateProject.builder()
            .name("MapStruct Updated Project")
            .description("Updated via MapStruct")
            .status(ProjectStatus.STARTED)
            .progress(75.0)
            .build();

        // Update via API (which uses MapStruct internally)
        given()
            .contentType(ContentType.JSON)
            .body(update)
            .when().put("/api/projects/" + projectId)
            .then()
            .statusCode(200)
            .body("name", equalTo("MapStruct Updated Project"))
            .body("description", equalTo("Updated via MapStruct"))
            .body("status", equalTo("STARTED"))
            .body("progress", equalTo(75.0f))
            .body("owner", equalTo("Original Owner")); // Should remain unchanged (partial update)

        // Verify the mapping worked correctly by fetching the project
        given()
            .when().get("/api/projects/" + projectId)
            .then()
            .statusCode(200)
            .body("name", equalTo("MapStruct Updated Project"))
            .body("description", equalTo("Updated via MapStruct"))
            .body("status", equalTo("STARTED"))
            .body("progress", equalTo(75.0f))
            .body("owner", equalTo("Original Owner"));
    }

    @Test
    void testUpdateProjectValidation() {
        // First create a project
        Project project = new Project();
        project.name = "Validation Test";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Try to update with invalid progress (over 100)
        UpdateProject invalidUpdate = UpdateProject.builder()
            .progress(150.0) // Invalid - over 100%
            .build();

        given()
            .contentType(ContentType.JSON)
            .body(invalidUpdate)
            .when().put("/api/projects/" + projectId)
            .then()
            .statusCode(400); // Should fail validation
    }
}
