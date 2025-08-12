package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.junit.jupiter.api.*;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.hasSize;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProjectResourceTest {

    @BeforeEach
    void setUp() {
        // Clear all projects before each test
        given()
            .when().delete("/api/projects")
            .then()
            .statusCode(204);
    }

    @Test
    @Order(1)
    void testCreateProject() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "name": "Test Project",
                    "description": "Test project description",
                    "owner": "Test Owner",
                    "dueDate": "2025-12-31T23:59:59Z"
                }
                """)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("name", equalTo("Test Project"))
            .body("description", equalTo("Test project description"))
            .body("owner", equalTo("Test Owner"))
            .body("status", equalTo("PENDING"))
            .body("version", equalTo(1))
            .body("id", notNullValue());
    }

    @Test
    @Order(2)
    void testGetProject() {
        // First create a project
        String id = createTestProject("Get Test Project", "Description", "Owner");

        given()
            .when().get("/api/projects/{id}", id)
            .then()
            .statusCode(200)
            .body("id", equalTo(id))
            .body("name", equalTo("Get Test Project"))
            .body("description", equalTo("Description"))
            .body("owner", equalTo("Owner"))
            .body("version", equalTo(1));
    }

    @Test
    @Order(3)
    void testUpdateProject() {
        // First create a project
        String id = createTestProject("Update Test Project", "Original description", "Original Owner");

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "name": "Updated Test Project",
                    "description": "Updated description",
                    "owner": "Updated Owner",
                    "dueDate": "2025-06-30T23:59:59Z"
                }
                """)
            .when().put("/api/projects/{id}", id)
            .then()
            .statusCode(200)
            .body("name", equalTo("Updated Test Project"))
            .body("description", equalTo("Updated description"))
            .body("owner", equalTo("Updated Owner"))
            .body("version", equalTo(2)); // Version should increment
    }

    @Test
    @Order(4)
    void testActivateProject() {
        // First create a project
        String id = createTestProject("Activate Test Project", "Description", "Owner");

        given()
            .when().put("/api/projects/{id}/start", id)  // Changed from POST activate to PUT start
            .then()
            .statusCode(200)
            .body("status", equalTo("STARTED"))  // Changed from ACTIVE to STARTED
            .body("version", equalTo(2)); // Version should increment
    }

    @Test
    @Order(5)
    void testCompleteProject() {
        // First create and activate a project
        String id = createTestProject("Complete Test Project", "Description", "Owner");
        
        given()
            .when().put("/api/projects/{id}/start", id)  // Changed from POST activate to PUT start
            .then()
            .statusCode(200);

        given()
            .when().put("/api/projects/{id}/complete", id)  // Changed from POST to PUT
            .then()
            .statusCode(200)
            .body("status", equalTo("COMPLETED"))
            .body("version", equalTo(3)); // Version should increment again
    }

    @Test
    @Order(6)
    void testDeleteProject() {
        // First create a project
        String id = createTestProject("Delete Test Project", "Description", "Owner");

        given()
            .when().delete("/api/projects/{id}", id)
            .then()
            .statusCode(200)  // Changed from 204 to 200 since it returns the deleted project
            .body("status", equalTo("DELETED")); // Verify it's marked as deleted

        // Verify project is marked as deleted (soft delete, so still accessible but marked)
        given()
            .when().get("/api/projects/{id}", id)
            .then()
            .statusCode(200)  // Changed from 404 to 200 since soft delete
            .body("status", equalTo("DELETED"));
    }

    @Test
    @Order(7)
    void testGetAllProjects() {
        // Create multiple projects
        createTestProject("Project 1", "Description 1", "Owner 1");
        createTestProject("Project 2", "Description 2", "Owner 2");
        createTestProject("Project 3", "Description 3", "Owner 3");

        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("$", hasSize(3));
    }

    @Test
    @Order(8)
    void testGetProjectsByStatus() {
        // Create projects with different statuses
        String id1 = createTestProject("Pending Project", "Description", "Owner");
        String id2 = createTestProject("Active Project", "Description", "Owner");
        String id3 = createTestProject("Completed Project", "Description", "Owner");
        
        // Activate one project
        given()
            .when().put("/api/projects/{id}/start", id2)  // Changed from POST activate to PUT start
            .then()
            .statusCode(200);

        // Complete one project
        given()
            .when().put("/api/projects/{id}/start", id3)  // Changed from POST activate to PUT start
            .then()
            .statusCode(200);
        
        given()
            .when().put("/api/projects/{id}/complete", id3)  // Changed from POST to PUT
            .then()
            .statusCode(200);

        // Test pending projects - using correct endpoint
        given()
            .when().get("/api/projects/status/PENDING")  // Changed from /pending to /status/PENDING
            .then()
            .statusCode(200)
            .body("$", hasSize(1))
            .body("[0].name", equalTo("Pending Project"));

        // Test active projects - using correct endpoint
        given()
            .when().get("/api/projects/status/STARTED")  // Changed from /active to /status/STARTED
            .then()
            .statusCode(200)
            .body("$", hasSize(1))
            .body("[0].name", equalTo("Active Project"));

        // Test completed projects - using correct endpoint
        given()
            .when().get("/api/projects/status/COMPLETED")  // Changed from /completed to /status/COMPLETED
            .then()
            .statusCode(200)
            .body("$", hasSize(1))
            .body("[0].name", equalTo("Completed Project"));
    }

    @Test
    @Order(9)
    void testSearchProjects() {
        // Create test projects
        createTestProject("Search Project Alpha", "First search project", "Alice");
        createTestProject("Search Project Beta", "Second search project", "Bob");
        createTestProject("Different Project", "Not a search project", "Alice");

        // Test search by owner using existing endpoint
        given()
            .when().get("/api/projects/owner/{owner}", "Alice")
            .then()
            .statusCode(200)
            .body("$", hasSize(2));

        // Test search by owner
        given()
            .when().get("/api/projects/owner/{owner}", "Bob")
            .then()
            .statusCode(200)
            .body("$", hasSize(1));
    }

    @Test
    @Order(10)
    void testProjectVersionTracking() {
        // Create a project
        String id = createTestProject("Version Test Project", "Original description", "Original Owner");

        // Verify initial version
        given()
            .when().get("/api/projects/{id}", id)
            .then()
            .body("version", equalTo(1));

        // Update project
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "name": "Updated Version Test Project",
                    "description": "Updated description",
                    "owner": "Updated Owner"
                }
                """)
            .when().put("/api/projects/{id}", id)
            .then()
            .body("version", equalTo(2));

        // Start project
        given()
            .when().put("/api/projects/{id}/start", id)  // Changed from POST activate to PUT start
            .then()
            .body("version", equalTo(3));

        // Complete project
        given()
            .when().put("/api/projects/{id}/complete", id)  // Changed from POST to PUT
            .then()
            .body("version", equalTo(4));
    }

    @Test
    @Order(11)
    void testErrorHandling() {
        String nonExistentId = UUID.randomUUID().toString();

        // Test getting non-existent project
        given()
            .when().get("/api/projects/{id}", nonExistentId)
            .then()
            .statusCode(404);

        // Test updating non-existent project
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "name": "Updated Project",
                    "description": "Updated description",
                    "owner": "Updated Owner"
                }
                """)
            .when().put("/api/projects/{id}", nonExistentId)
            .then()
            .statusCode(404);

        // Test deleting non-existent project
        given()
            .when().delete("/api/projects/{id}", nonExistentId)
            .then()
            .statusCode(404);

        // Test activating non-existent project
        given()
            .when().post("/api/projects/{id}/activate", nonExistentId)
            .then()
            .statusCode(404);
    }

    @Test
    @Order(12)
    void testProjectStatusTransitions() {
        // Create a project
        String id = createTestProject("Status Transition Project", "Description", "Owner");

        // Verify initial status is PENDING
        given()
            .when().get("/api/projects/{id}", id)
            .then()
            .body("status", equalTo("PENDING"));

        // Start project
        given()
            .when().put("/api/projects/{id}/start", id)  // Changed from POST activate to PUT start
            .then()
            .body("status", equalTo("STARTED"));  // Changed from ACTIVE to STARTED

        // Complete project
        given()
            .when().put("/api/projects/{id}/complete", id)  // Changed from POST to PUT
            .then()
            .body("status", equalTo("COMPLETED"));

        // Try to start completed project (should fail or be ignored)
        given()
            .when().put("/api/projects/{id}/start", id)  // Changed from POST activate to PUT start
            .then()
            .statusCode(anyOf(equalTo(200), equalTo(400))); // Depending on business logic
    }

    // Helper method
    private String createTestProject(String name, String description, String owner) {
        return given()
            .contentType(ContentType.JSON)
            .body(String.format("""
                {
                    "name": "%s",
                    "description": "%s",
                    "owner": "%s",
                    "dueDate": "2025-12-31T23:59:59Z"
                }
                """, name, description, owner))
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");
    }
}
