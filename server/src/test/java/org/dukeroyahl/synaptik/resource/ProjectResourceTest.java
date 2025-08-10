package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.matchesPattern;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectResourceTest {

    @BeforeEach
    void setUp() {
        // Clean up projects collection before each test
        given()
            .when().delete("/api/projects")
            .then()
            .statusCode(204);
    }

    @Test
    @Order(1)
    public void testCreateProjectWithNameOnly() {
        String projectJson = """
            {
                "name": "Test Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("name", equalTo("Test Project"))
            .body("description", anyOf(nullValue(), equalTo("")))
            .body("owner", anyOf(nullValue(), equalTo("")))
            .body("status", equalTo("PENDING"));
    }

    @Test
    @Order(2)
    public void testCreateProjectWithAllFields() {
        String projectJson = """
            {
                "name": "Complete Project",
                "description": "A project with all fields",
                "owner": "John Doe"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("name", equalTo("Complete Project"))
            .body("description", equalTo("A project with all fields"))
            .body("owner", equalTo("John Doe"))
            .body("status", equalTo("PENDING"));
    }

    @Test
    @Order(3)
    public void testCreateProjectWithEmptyName() {
        String projectJson = """
            {
                "name": ""
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(400);
    }

    @Test
    @Order(4)
    public void testCreateProjectWithNullName() {
        String projectJson = """
            {
                "description": "Project without name"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(400);
    }

    @Test
    @Order(5)
    public void testGetAllProjects() {
        // Create two projects first
        String project1Json = """
            {
                "name": "Project 1"
            }
            """;
        
        String project2Json = """
            {
                "name": "Project 2"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(project1Json)
            .when().post("/api/projects")
            .then()
            .statusCode(201);

        given()
            .contentType(ContentType.JSON)
            .body(project2Json)
            .when().post("/api/projects")
            .then()
            .statusCode(201);

        // Get all projects
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("[0].name", anyOf(equalTo("Project 1"), equalTo("Project 2")))
            .body("[1].name", anyOf(equalTo("Project 1"), equalTo("Project 2")));
    }

    @Test
    @Order(6)
    public void testGetProjectById() {
        String projectJson = """
            {
                "name": "Specific Project"
            }
            """;

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        given()
            .when().get("/api/projects/" + projectId)
            .then()
            .statusCode(200)
            .body("id", equalTo(projectId))
            .body("name", equalTo("Specific Project"));
    }

    @Test
    @Order(7)
    public void testGetNonExistentProject() {
        String nonExistentId = "550e8400-e29b-41d4-a716-446655440000";
        
        given()
            .when().get("/api/projects/" + nonExistentId)
            .then()
            .statusCode(404);
    }

    @Test
    @Order(8)
    public void testDuplicateProjectNames() {
        String projectJson = """
            {
                "name": "Duplicate Name"
            }
            """;

        // Create first project
        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201);

        // Try to create second project with same name - should succeed (different IDs)
        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201);
    }

    @Test
    @Order(9)
    public void testProjectStart() {
        String projectJson = """
            {
                "name": "Project to Start"
            }
            """;

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Start project
        given()
            .when().put("/api/projects/" + projectId + "/start")
            .then()
            .statusCode(200)
            .body("status", equalTo("STARTED"));
    }

    @Test
    @Order(10)
    public void testProjectCompletion() {
        String projectJson = """
            {
                "name": "Project to Complete"
            }
            """;

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Complete project
        given()
            .when().put("/api/projects/" + projectId + "/complete")
            .then()
            .statusCode(200)
            .body("status", equalTo("COMPLETED"))
            .body("progress", equalTo(100.0f));
    }
}
