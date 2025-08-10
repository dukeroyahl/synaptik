package org.dukeroyahl.synaptik;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectCreationTest {

    @BeforeEach
    void cleanUp() {
        // Clean up projects and tasks before each test
        given()
            .when().delete("/api/projects")
            .then().statusCode(204);
        
        given()
            .when().delete("/api/tasks")
            .then().statusCode(204);
    }

    @Test
    public void testCreateTaskWithNonExistentProjectName() {
        String taskJson = """
            {
                "title": "Test Task",
                "description": "Test Description",
                "priority": "MEDIUM",
                "project": "Auto Created Project"
            }
            """;

        // Create task with non-existent project name
        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Task"))
            .body("project", equalTo("Auto Created Project"))
            .body("projectDetails.name", equalTo("Auto Created Project"))
            .body("projectDetails.status", equalTo("PENDING"))
            .body("projectId", notNullValue())
            .body("projectId", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));

        // Verify project was auto-created in separate collection
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Auto Created Project"))
            .body("[0].status", equalTo("PENDING"));
    }

    @Test
    public void testCreateProjectWithNameOnly() {
        String projectJson = """
            {
                "name": "Simple Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("name", equalTo("Simple Project"))
            .body("status", equalTo("PENDING"))
            .body("id", notNullValue())
            .body("createdAt", notNullValue())
            .body("updatedAt", notNullValue());
    }

    @Test
    public void testCreateTaskWithExistingProjectName() {
        // First create a project
        String projectJson = """
            {
                "name": "Existing Project",
                "description": "Pre-existing project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201);

        // Create task with existing project name
        String taskJson = """
            {
                "title": "Test Task",
                "description": "Test Description",
                "priority": "MEDIUM",
                "project": "Existing Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Task"))
            .body("project", equalTo("Existing Project"))
            .body("projectDetails.name", equalTo("Existing Project"));

        // Verify only one project exists (no duplicate created)
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Existing Project"));
    }

    @Test
    public void testTaskWithoutProject() {
        String taskJson = """
            {
                "title": "Standalone Task",
                "description": "Task without project",
                "priority": "LOW"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Standalone Task"))
            .body("project", nullValue())
            .body("projectId", nullValue())
            .body("projectDetails", nullValue());

        // Verify no projects were created
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    public void testTaskEnrichmentWithProjectDetails() {
        String taskJson = """
            {
                "title": "Enrichment Test Task",
                "description": "Test task enrichment",
                "priority": "HIGH",
                "project": "Enrichment Test Project"
            }
            """;

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Verify task is enriched with project details when retrieved
        given()
            .when().get("/api/tasks/" + taskId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Enrichment Test Task"))
            .body("project", equalTo("Enrichment Test Project"))
            .body("projectDetails.name", equalTo("Enrichment Test Project"))
            .body("projectDetails.status", equalTo("PENDING"))
            .body("projectId", notNullValue());
    }

    @Test
    public void testProjectStoredInSeparateCollection() {
        String taskJson = """
            {
                "title": "Collection Test Task",
                "description": "Test separate collection storage",
                "priority": "MEDIUM",
                "project": "Collection Test Project"
            }
            """;

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Verify project exists in projects collection
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Collection Test Project"));

        // Verify task references project by ID, not name
        given()
            .when().get("/api/tasks/" + taskId)
            .then()
            .statusCode(200)
            .body("projectId", notNullValue())
            .body("projectDetails.name", equalTo("Collection Test Project"));
    }

    @Test
    public void testProjectAndTaskUUIDFormats() {
        String taskJson = """
            {
                "title": "UUID Test Task",
                "description": "Test UUID formats",
                "priority": "HIGH",
                "project": "UUID Test Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("projectId", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));

        // Verify project also has UUID format
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    }

    @Test
    public void testMultipleTasksSameProject() {
        String task1Json = """
            {
                "title": "Task 1",
                "description": "First task",
                "priority": "HIGH",
                "project": "Shared Project"
            }
            """;

        String task2Json = """
            {
                "title": "Task 2",
                "description": "Second task",
                "priority": "MEDIUM",
                "project": "Shared Project"
            }
            """;

        // Create first task
        given()
            .contentType(ContentType.JSON)
            .body(task1Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("project", equalTo("Shared Project"));

        // Create second task with same project
        given()
            .contentType(ContentType.JSON)
            .body(task2Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("project", equalTo("Shared Project"));

        // Verify only one project was created
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Shared Project"));

        // Verify both tasks exist
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("[0].project", equalTo("Shared Project"))
            .body("[1].project", equalTo("Shared Project"));
    }

    @Test
    public void testProjectAutoCompletionWhenAllTasksCompleted() {
        String task1Json = """
            {
                "title": "Task 1",
                "description": "First task",
                "priority": "HIGH",
                "project": "Auto Complete Project"
            }
            """;

        String task2Json = """
            {
                "title": "Task 2",
                "description": "Second task",
                "priority": "MEDIUM",
                "project": "Auto Complete Project"
            }
            """;

        // Create tasks
        String task1Id = given()
            .contentType(ContentType.JSON)
            .body(task1Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        String task2Id = given()
            .contentType(ContentType.JSON)
            .body(task2Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Complete first task
        given()
            .when().post("/api/tasks/" + task1Id + "/done")
            .then()
            .statusCode(200);

        // Project should still be PENDING (not all tasks completed)
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("PENDING"))
            .body("[0].progress", equalTo(50.0f)); // 1 out of 2 tasks completed

        // Complete second task
        given()
            .when().post("/api/tasks/" + task2Id + "/done")
            .then()
            .statusCode(200);

        // Project should now be COMPLETED (all tasks completed)
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("COMPLETED"))
            .body("[0].progress", equalTo(100.0f)); // All tasks completed
    }

    @Test
    public void testProjectAutoStartWhenTaskStarted() {
        String taskJson = """
            {
                "title": "Auto Start Task",
                "description": "Task that will auto-start project",
                "priority": "HIGH",
                "project": "Auto Start Project"
            }
            """;

        // Create task
        String taskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Project should initially be PENDING
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("PENDING"));

        // Start the task
        given()
            .when().post("/api/tasks/" + taskId + "/start")
            .then()
            .statusCode(200);

        // Project should automatically move to STARTED status
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("STARTED"));
    }

    @Test
    public void testProjectNameCaseSensitivity() {
        String task1Json = """
            {
                "title": "Task 1",
                "description": "First task",
                "priority": "HIGH",
                "project": "Test Project"
            }
            """;

        String task2Json = """
            {
                "title": "Task 2",
                "description": "Second task",
                "priority": "MEDIUM",
                "project": "test project"
            }
            """;

        // Create tasks with different case project names
        given()
            .contentType(ContentType.JSON)
            .body(task1Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201);

        given()
            .contentType(ContentType.JSON)
            .body(task2Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201);

        // Verify two separate projects were created (case sensitive)
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2));
    }

    @Test
    public void testProjectCreationWithMinimalData() {
        String taskJson = """
            {
                "title": "Minimal Task",
                "project": "Minimal Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Minimal Task"))
            .body("project", equalTo("Minimal Project"))
            .body("priority", equalTo("NONE")) // Default priority
            .body("status", equalTo("PENDING")); // Default status

        // Verify project was created with minimal data
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Minimal Project"))
            .body("[0].status", equalTo("PENDING"));
    }
}
