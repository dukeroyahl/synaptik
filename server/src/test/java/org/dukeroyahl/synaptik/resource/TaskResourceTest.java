package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.hasSize;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TaskResourceTest {

    @BeforeEach
    void setUp() {
        // Clear all tasks before each test
        given()
            .when().delete("/api/tasks")
            .then()
            .statusCode(204);
    }

    @Test
    @Order(1)
    void testCreateTask() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "title": "Test Task 1",
                    "description": "Test task description",
                    "priority": "HIGH",
                    "assignee": "Test User",
                    "tags": ["test", "api"]
                }
                """)
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .body("title", equalTo("Test Task 1"))
            .body("description", equalTo("Test task description"))
            .body("priority", equalTo("HIGH"))
            .body("assignee", equalTo("Test User"))
            .body("status", equalTo("PENDING"))
            .body("version", equalTo(1))
            .body("id", notNullValue());
    }

    @Test
    @Order(2)
    void testGetTask() {
        // First create a task
        String id = createTestTask("Get Test Task", "Description", "MEDIUM", "User");

        given()
            .when().get("/api/tasks/{id}", id)
            .then()
            .statusCode(200)
            .body("id", equalTo(id))
            .body("title", equalTo("Get Test Task"))
            .body("priority", equalTo("MEDIUM"))
            .body("version", equalTo(1));
    }

    @Test
    @Order(3)
    void testUpdateTask() {
        // First create a task
        String id = createTestTask("Update Test Task", "Original description", "LOW", "Original User");

        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "title": "Updated Test Task",
                    "description": "Updated description",
                    "priority": "HIGH",
                    "assignee": "Updated User"
                }
                """)
            .when().put("/api/tasks/{id}", id)
            .then()
            .statusCode(200)
            .body("title", equalTo("Updated Test Task"))
            .body("description", equalTo("Updated description"))
            .body("priority", equalTo("HIGH"))
            .body("assignee", equalTo("Updated User"))
            .body("version", equalTo(2)); // Version should increment
    }

    @Test
    @Order(4)
    void testUpdateTaskStatus() {
        // First create a task
        String id = createTestTask("Status Test Task", "Description", "MEDIUM", "User");

        given()
            .contentType(ContentType.JSON)
            .body("\"ACTIVE\"")
            .when().put("/api/tasks/{id}/status", id)
            .then()
            .statusCode(200)
            .body(equalTo("true"));

        // Verify status was updated and version incremented
        given()
            .when().get("/api/tasks/{id}", id)
            .then()
            .statusCode(200)
            .body("status", equalTo("ACTIVE"))
            .body("version", equalTo(2));
    }

    @Test
    @Order(5)
    void testDeleteTask() {
        // First create a task
        String id = createTestTask("Delete Test Task", "Description", "LOW", "User");

        given()
            .when().delete("/api/tasks/{id}", id)
            .then()
            .statusCode(204);

        // Verify task is deleted
        given()
            .when().get("/api/tasks/{id}", id)
            .then()
            .statusCode(404);
    }

    @Test
    @Order(6)
    void testGetAllTasks() {
        // Create multiple tasks
        createTestTask("Task 1", "Description 1", "HIGH", "User 1");
        createTestTask("Task 2", "Description 2", "MEDIUM", "User 2");
        createTestTask("Task 3", "Description 3", "LOW", "User 3");

        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("$", hasSize(3));
    }

    @Test
    @Order(7)
    void testTaskLinking() {
        // Create two tasks
        String taskA = createTestTask("Task A", "Foundation task", "HIGH", "User A");
        String taskB = createTestTask("Task B", "Dependent task", "MEDIUM", "User B");

        // Link Task B to depend on Task A (no body needed for POST)
        given()
            .contentType(ContentType.JSON) // Set explicit content type
            .when().post("/api/tasks/{id}/link/{dependencyId}", taskB, taskA)
            .then()
            .statusCode(200)
            .body("message", equalTo("Tasks linked successfully"));

        // Verify Task B dependencies
        given()
            .when().get("/api/tasks/{id}/dependencies", taskB)
            .then()
            .statusCode(200)
            .body("$", hasSize(1))
            .body("[0].id", equalTo(taskA));

        // Test unlinking
        given()
            .contentType(ContentType.JSON) // Set explicit content type
            .when().delete("/api/tasks/{id}/link/{dependencyId}", taskB, taskA)
            .then()
            .statusCode(200)
            .body("message", equalTo("Tasks unlinked successfully"));

        // Verify link is removed
        given()
            .when().get("/api/tasks/{id}/dependencies", taskB)
            .then()
            .statusCode(200)
            .body("$", hasSize(0));
    }

    @Test
    @Order(8)
    void testCircularDependencyPrevention() {
        // Create three tasks
        String taskA = createTestTask("Task A", "Description", "HIGH", "User");
        String taskB = createTestTask("Task B", "Description", "MEDIUM", "User");
        String taskC = createTestTask("Task C", "Description", "LOW", "User");

        // Create chain: A <- B <- C
        given()
            .contentType(ContentType.JSON)
            .when().post("/api/tasks/{id}/link/{dependencyId}", taskB, taskA)
            .then()
            .statusCode(200);

        given()
            .contentType(ContentType.JSON)
            .when().post("/api/tasks/{id}/link/{dependencyId}", taskC, taskB)
            .then()
            .statusCode(200);

        // Try to create circular dependency: A <- C (would create A <- B <- C <- A)
        given()
            .contentType(ContentType.JSON)
            .when().post("/api/tasks/{id}/link/{dependencyId}", taskA, taskC)
            .then()
            .statusCode(400)
            .body("error", containsString("circular dependency"));
    }

    @Test
    @Order(9)
    void testFileImport() throws IOException {
        // Create test JSON file
        File testFile = createTestImportFile();

        try {
            // Import tasks and verify the import response
            given()
                .multiPart("file", testFile, "application/json")
                .when().post("/api/tasks/import")
                .then()
                .statusCode(200)
                .body("message", containsString("Successfully imported 2 tasks"));

            // Add a small delay to ensure async operations complete
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // Verify imported tasks exist by checking specific IDs
            given()
                .when().get("/api/tasks/11111111-1111-1111-1111-111111111111")
                .then()
                .statusCode(200)
                .body("title", equalTo("Imported Task 1"))
                .body("version", equalTo(5));

            given()
                .when().get("/api/tasks/22222222-2222-2222-2222-222222222222")
                .then()
                .statusCode(200)
                .body("title", equalTo("Imported Task 2"))
                .body("version", equalTo(3));

        } finally {
            testFile.delete();
        }
    }

    @Test
    @Order(10)
    void testExport() {
        // Create some test tasks
        createTestTask("Export Task 1", "Description 1", "HIGH", "User 1");
        createTestTask("Export Task 2", "Description 2", "MEDIUM", "User 2");

        given()
            .when().get("/api/tasks/export")
            .then()
            .statusCode(200)
            .body("$", hasSize(2))
            .body("[0].title", notNullValue())
            .body("[0].version", notNullValue())
            .body("[0].createdAt", notNullValue());
    }

    @Test
    @Order(11)
    void testVersionTracking() {
        // Create a task
        String id = createTestTask("Version Test Task", "Original", "MEDIUM", "User");

        // Verify initial version
        given()
            .when().get("/api/tasks/{id}", id)
            .then()
            .body("version", equalTo(1));

        // Update task
        given()
            .contentType(ContentType.JSON)
            .body("""
                {
                    "title": "Updated Version Test Task",
                    "description": "Updated",
                    "priority": "HIGH",
                    "assignee": "Updated User"
                }
                """)
            .when().put("/api/tasks/{id}", id)
            .then()
            .body("version", equalTo(2));

        // Update status
        given()
            .contentType(ContentType.JSON)
            .body("\"ACTIVE\"")
            .when().put("/api/tasks/{id}/status", id)
            .then()
            .statusCode(200);

        // Verify version incremented again
        given()
            .when().get("/api/tasks/{id}", id)
            .then()
            .body("version", equalTo(3));
    }

    @Test
    @Order(12)
    void testErrorHandling() {
        String nonExistentId = UUID.randomUUID().toString();

        // Test getting non-existent task
        given()
            .when().get("/api/tasks/{id}", nonExistentId)
            .then()
            .statusCode(404);

        // Test linking with non-existent task
        String existingTask = createTestTask("Existing Task", "Description", "MEDIUM", "User");
        given()
            .contentType(ContentType.JSON)
            .when().post("/api/tasks/{id}/link/{dependencyId}", existingTask, nonExistentId)
            .then()
            .statusCode(404)
            .body("error", containsString("not found"));
    }

    // Helper methods

    private String createTestTask(String title, String description, String priority, String assignee) {
        return given()
            .contentType(ContentType.JSON)
            .body(String.format("""
                {
                    "title": "%s",
                    "description": "%s",
                    "priority": "%s",
                    "assignee": "%s"
                }
                """, title, description, priority, assignee))
            .when().post("/api/tasks")
            .then()
            .statusCode(201)
            .extract().path("id");
    }

    private File createTestImportFile() throws IOException {
        File testFile = File.createTempFile("test-import", ".json");
        try (FileWriter writer = new FileWriter(testFile)) {
            writer.write("""
                [
                    {
                        "id": "11111111-1111-1111-1111-111111111111",
                        "title": "Imported Task 1",
                        "description": "First imported task",
                        "status": "PENDING",
                        "priority": "HIGH",
                        "assignee": "Import User 1",
                        "tags": ["imported", "test"],
                        "depends": [],
                        "annotations": [],
                        "originalInput": "Original input",
                        "createdAt": "2025-01-01T10:00:00Z",
                        "updatedAt": "2025-01-01T10:00:00Z",
                        "version": 5,
                        "urgency": 15.0
                    },
                    {
                        "id": "22222222-2222-2222-2222-222222222222",
                        "title": "Imported Task 2",
                        "description": "Second imported task",
                        "status": "ACTIVE",
                        "priority": "MEDIUM",
                        "assignee": "Import User 2",
                        "tags": ["imported"],
                        "depends": ["11111111-1111-1111-1111-111111111111"],
                        "annotations": [],
                        "originalInput": "Second input",
                        "createdAt": "2025-01-02T15:30:00Z",
                        "updatedAt": "2025-01-03T09:15:00Z",
                        "version": 3,
                        "urgency": 8.5
                    }
                ]
                """);
        }
        return testFile;
    }
}
