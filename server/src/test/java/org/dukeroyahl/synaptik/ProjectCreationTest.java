package org.dukeroyahl.synaptik;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.dukeroyahl.synaptik.domain.Project;
import org.dukeroyahl.synaptik.domain.ProjectStatus;
import org.dukeroyahl.synaptik.domain.Task;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

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
    void testCreateProjectWithNameOnly() {
        // Test Guideline 1: Should be able to create a project just with its name
        Project project = new Project();
        project.name = "Test Project";

        String response = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("name", equalTo("Test Project"))
            .body("status", equalTo("PENDING"))
            .body("progress", equalTo(0.0f))
            .body("id", notNullValue())
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .extract().asString();

        // Verify project is stored in separate collection by retrieving it
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Test Project"))
            .body("[0].status", equalTo("PENDING"));
    }

    @Test
    void testCreateTaskWithNonExistentProjectName() {
        // Test Guideline 2: Creating task with project name should auto-create project
        Task task = new Task();
        task.title = "Test Task";
        task.description = "Test Description";
        task.priority = TaskPriority.MEDIUM;
        task.project = "Auto Created Project";

        String taskResponse = given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Task"))
            .body("projectDetails.name", equalTo("Auto Created Project"))
            .body("projectDetails.status", equalTo("PENDING"))
            .body("projectId", notNullValue())
            .body("projectId", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .extract().asString();

        // Verify project was auto-created in separate collection
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Auto Created Project"))
            .body("[0].status", equalTo("PENDING"))
            .body("[0].id", notNullValue())
            .body("[0].id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    }

    @Test
    void testCreateTaskWithExistingProjectName() {
        // First create a project
        Project project = new Project();
        project.name = "Existing Project";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Then create a task referencing the existing project
        Task task = new Task();
        task.title = "Test Task";
        task.description = "Test Description";
        task.priority = TaskPriority.HIGH;
        task.project = "Existing Project";

        given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Task"))
            .body("projectDetails.name", equalTo("Existing Project"))
            .body("projectId", equalTo(projectId));

        // Verify only one project exists (no duplicate created)
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Existing Project"))
            .body("[0].id", equalTo(projectId));
    }

    @Test
    void testProjectStoredInSeparateCollection() {
        // Test Guideline 3: Projects should be stored in separate collection
        Project project = new Project();
        project.name = "Collection Test Project";

        given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201);

        // Verify project can be retrieved from projects endpoint
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Collection Test Project"));

        // Verify tasks collection is empty
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    void testTaskEnrichmentWithProjectDetails() {
        // Test Guideline 4: During task retrieval, project details should be enriched
        
        // Create project first
        Project project = new Project();
        project.name = "Enrichment Test Project";
        project.description = "Project for testing enrichment";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Create task with project name
        Task task = new Task();
        task.title = "Enrichment Test Task";
        task.description = "Task for testing enrichment";
        task.priority = TaskPriority.LOW;
        task.project = "Enrichment Test Project";

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("projectId", equalTo(projectId))
            .body("projectDetails.name", equalTo("Enrichment Test Project"))
            .body("projectDetails.description", equalTo("Project for testing enrichment"))
            .body("projectDetails.id", equalTo(projectId))
            .extract().path("id");

        // Verify task retrieval includes enriched project details
        given()
            .when().get("/api/tasks/" + taskId)
            .then()
            .statusCode(200)
            .body("title", equalTo("Enrichment Test Task"))
            .body("projectId", equalTo(projectId))
            .body("projectDetails.name", equalTo("Enrichment Test Project"))
            .body("projectDetails.description", equalTo("Project for testing enrichment"))
            .body("projectDetails.status", equalTo("PENDING"));

        // Verify task list includes enriched project details
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].projectId", equalTo(projectId))
            .body("[0].projectDetails.name", equalTo("Enrichment Test Project"));
    }

    @Test
    void testTaskWithoutProject() {
        // Test that tasks can be created without projects
        Task task = new Task();
        task.title = "Standalone Task";
        task.description = "Task without project";
        task.priority = TaskPriority.NONE;

        given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Standalone Task"))
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
    void testProjectAndTaskUUIDFormats() {
        // Test Guidelines 5 & 6: Both Project ID and Task ID should be UUIDs
        
        // Create project and verify UUID format
        Project project = new Project();
        project.name = "UUID Test Project";

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .extract().path("id");

        // Verify projectId is valid UUID
        assertDoesNotThrow(() -> UUID.fromString(projectId));

        // Create task and verify UUID format
        Task task = new Task();
        task.title = "UUID Test Task";
        task.priority = TaskPriority.MEDIUM;
        task.project = "UUID Test Project";

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("projectId", equalTo(projectId))
            .extract().path("id");

        // Verify taskId is valid UUID
        assertDoesNotThrow(() -> UUID.fromString(taskId));
    }

    @Test
    void testProjectCreationWithMinimalData() {
        // Test that project can be created with just name (all other fields optional)
        Project project = new Project();
        project.name = "Minimal Project";

        given()
            .contentType(ContentType.JSON)
            .body(project)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .body("name", equalTo("Minimal Project"))
            .body("description", nullValue())
            .body("status", equalTo("PENDING"))
            .body("progress", equalTo(0.0f))
            .body("owner", nullValue())
            .body("tags", empty())
            .body("members", empty());
    }

    @Test
    void testMultipleTasksSameProject() {
        // Test that multiple tasks can reference the same project
        Task task1 = new Task();
        task1.title = "First Task";
        task1.priority = TaskPriority.HIGH;
        task1.project = "Shared Project";

        Task task2 = new Task();
        task2.title = "Second Task";
        task2.priority = TaskPriority.MEDIUM;
        task2.project = "Shared Project";

        // Create first task (should auto-create project)
        String projectId1 = given()
            .contentType(ContentType.JSON)
            .body(task1)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("projectDetails.name", equalTo("Shared Project"))
            .extract().path("projectId");

        // Create second task (should use existing project)
        String projectId2 = given()
            .contentType(ContentType.JSON)
            .body(task2)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("projectDetails.name", equalTo("Shared Project"))
            .extract().path("projectId");

        // Both tasks should reference the same project
        assertEquals(projectId1, projectId2);

        // Verify only one project exists
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
            .body("size()", equalTo(2));
    }

    @Test
    void testProjectAutoCompletionWhenAllTasksCompleted() {
        // Create a project with multiple tasks
        Task task1 = new Task();
        task1.title = "First Task";
        task1.priority = TaskPriority.HIGH;
        task1.project = "Auto Complete Project";

        Task task2 = new Task();
        task2.title = "Second Task";
        task2.priority = TaskPriority.MEDIUM;
        task2.project = "Auto Complete Project";

        // Create both tasks
        String task1Id = given()
            .contentType(ContentType.JSON)
            .body(task1)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        String task2Id = given()
            .contentType(ContentType.JSON)
            .body(task2)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Verify project is created and in PENDING status
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Auto Complete Project"))
            .body("[0].status", equalTo("PENDING"))
            .body("[0].progress", equalTo(0.0f));

        // Complete first task
        given()
            .when().put("/api/tasks/" + task1Id + "/done")
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
            .when().put("/api/tasks/" + task2Id + "/done")
            .then()
            .statusCode(200);

        // Project should now be COMPLETED automatically
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("COMPLETED"))
            .body("[0].progress", equalTo(100.0f))
            .body("[0].endDate", notNullValue()); // End date should be set
    }

    @Test
    void testProjectAutoStartWhenTaskStarted() {
        // Create a project with a task
        Task task = new Task();
        task.title = "Auto Start Task";
        task.priority = TaskPriority.HIGH;
        task.project = "Auto Start Project";

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(task)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Verify project starts in PENDING status
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("PENDING"));

        // Start the task
        given()
            .when().put("/api/tasks/" + taskId + "/start")
            .then()
            .statusCode(200);

        // Project should automatically move to STARTED status
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("[0].status", equalTo("STARTED"))
            .body("[0].startDate", notNullValue()); // Start date should be set
    }

    @Test
    void testProjectNameCaseSensitivity() {
        // Test that project names are case sensitive
        Task task1 = new Task();
        task1.title = "Task One";
        task1.priority = TaskPriority.HIGH;
        task1.project = "Test Project";

        Task task2 = new Task();
        task2.title = "Task Two";
        task2.priority = TaskPriority.MEDIUM;
        task2.project = "test project";

        // Create tasks with different case project names
        given()
            .contentType(ContentType.JSON)
            .body(task1)
            .when().post("/api/tasks")
            .then()
            .statusCode(201);

        given()
            .contentType(ContentType.JSON)
            .body(task2)
            .when().post("/api/tasks")
            .then()
            .statusCode(201);

        // Should create two separate projects
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2));
    }
}
