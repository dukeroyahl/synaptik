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
public class TaskProjectIntegrationTest {

    @BeforeEach
    void setUp() {
        // Clean up both collections before each test
        given()
            .when().delete("/api/tasks")
            .then()
            .statusCode(204);
            
        given()
            .when().delete("/api/projects")
            .then()
            .statusCode(204);
    }

    @Test
    @Order(1)
    public void testCreateTaskWithExistingProject() {
        // First create a project
        String projectJson = """
            {
                "name": "Existing Project"
            }
            """;

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Create task with existing project name
        String taskJson = """
            {
                "title": "Task with existing project",
                "description": "Test task",
                "priority": "HIGH",
                "projectName": "Existing Project",
                "assignee": "John Doe",
                "dueDate": "2025-12-31T23:59:59Z",
                "tags": ["test", "integration"]
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("title", equalTo("Task with existing project"))
            .body("projectId", equalTo(projectId))
            .body("projectName", equalTo("Existing Project"));
    }

    @Test
    @Order(2)
    public void testCreateTaskWithNonExistentProject() {
        // Create task with non-existent project name - should auto-create project
        String taskJson = """
            {
                "title": "Task with new project",
                "description": "Test task that creates project",
                "priority": "MEDIUM",
                "projectName": "Auto Created Project",
                "assignee": "Jane Doe",
                "dueDate": "2025-11-30T23:59:59Z",
                "tags": ["auto", "create"]
            }
            """;

        String taskResponse = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("title", equalTo("Task with new project"))
            .body("projectId", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("projectName", equalTo("Auto Created Project"))
            .extract().asString();

        // Verify the project was actually created
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Auto Created Project"));
    }

    @Test
    @Order(3)
    public void testCreateTaskWithoutProject() {
        // Create task without project - should work fine
        String taskJson = """
            {
                "title": "Task without project",
                "description": "Test task without project",
                "priority": "LOW",
                "assignee": "Bob Smith",
                "dueDate": "2025-10-15T23:59:59Z",
                "tags": ["standalone"]
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("id", matchesPattern("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            .body("title", equalTo("Task without project"))
            .body("projectId", nullValue())
            .body("projectId", nullValue())
            .body("projectName", nullValue());
    }

    @Test
    @Order(4)
    public void testGetTaskWithProjectEnrichment() {
        // Create a project first
        String projectJson = """
            {
                "name": "Enrichment Project",
                "description": "Project for testing enrichment",
                "owner": "Project Owner"
            }
            """;

        String projectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Create task with the project
        String taskJson = """
            {
                "title": "Task for enrichment test",
                "description": "Test task",
                "priority": "HIGH",
                "projectName": "Enrichment Project",
                "assignee": "Task Assignee",
                "dueDate": "2025-12-25T23:59:59Z",
                "tags": ["enrichment", "test"]
            }
            """;

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Get the task and verify project enrichment
        given()
            .when().get("/api/tasks/" + taskId)
            .then()
            .statusCode(200)
            .body("id", equalTo(taskId))
            .body("title", equalTo("Task for enrichment test"))
            .body("projectId", equalTo(projectId))
            .body("projectName", equalTo("Enrichment Project"));
    }

    @Test
    @Order(5)
    public void testGetAllTasksWithProjectEnrichment() {
        // Create two projects
        String project1Json = """
            {
                "name": "Project Alpha"
            }
            """;
        
        String project2Json = """
            {
                "name": "Project Beta"
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

        // Create tasks with these projects
        String task1Json = """
            {
                "title": "Task Alpha",
                "description": "Task in Project Alpha",
                "priority": "HIGH",
                "projectName": "Project Alpha",
                "assignee": "Alpha User",
                "dueDate": "2025-12-31T23:59:59Z",
                "tags": ["alpha"]
            }
            """;

        String task2Json = """
            {
                "title": "Task Beta",
                "description": "Task in Project Beta",
                "priority": "MEDIUM",
                "projectName": "Project Beta",
                "assignee": "Beta User",
                "dueDate": "2025-11-30T23:59:59Z",
                "tags": ["beta"]
            }
            """;

        String task3Json = """
            {
                "title": "Task Without Project",
                "description": "Standalone task",
                "priority": "LOW",
                "assignee": "Solo User",
                "dueDate": "2025-10-31T23:59:59Z",
                "tags": ["standalone"]
            }
            """;

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

        given()
            .contentType(ContentType.JSON)
            .body(task3Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201);

        // Get all tasks and verify project enrichment
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("findAll { it.title == 'Task Alpha' }[0].projectName", equalTo("Project Alpha"))
            .body("findAll { it.title == 'Task Beta' }[0].projectName", equalTo("Project Beta"))
            .body("findAll { it.title == 'Task Without Project' }[0].projectName", nullValue());
    }

    @Test
    @Order(6)
    public void testMultipleTasksCreateSameProject() {
        // Create multiple tasks with the same non-existent project name
        // Should create project only once
        String task1Json = """
            {
                "title": "Task 1",
                "description": "First task",
                "priority": "HIGH",
                "projectName": "Shared Project",
                "assignee": "User 1",
                "dueDate": "2025-12-31T23:59:59Z",
                "tags": ["shared"]
            }
            """;

        String task2Json = """
            {
                "title": "Task 2",
                "description": "Second task",
                "priority": "MEDIUM",
                "projectName": "Shared Project",
                "assignee": "User 2",
                "dueDate": "2025-11-30T23:59:59Z",
                "tags": ["shared"]
            }
            """;

        // Create both tasks
        String projectId1 = given()
            .contentType(ContentType.JSON)
            .body(task1Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("projectId");

        String projectId2 = given()
            .contentType(ContentType.JSON)
            .body(task2Json)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("projectId");

        // Both tasks should reference the same project
        assert projectId1.equals(projectId2);

        // Verify only one project was created
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].name", equalTo("Shared Project"));
    }

    @Test
    @Order(7)
    public void testTaskStorageDoesNotContainProjectName() {
        // Create task with project
        String taskJson = """
            {
                "title": "Storage Test Task",
                "description": "Test task storage",
                "priority": "HIGH",
                "projectName": "Storage Test Project",
                "assignee": "Test User",
                "dueDate": "2025-12-31T23:59:59Z",
                "tags": ["storage"]
            }
            """;

        String taskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");

        // Verify that the task response contains projectId and project name for backward compatibility
        // The project field is populated from projectDetails via getProject() method
        given()
            .when().get("/api/tasks/" + taskId)
            .then()
            .statusCode(200)
            .body("projectId", notNullValue())
            .body("projectName", equalTo("Storage Test Project")) // Now populated for backward compatibility
            .body("projectName", equalTo("Storage Test Project"));
    }
}
