package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.dukeroyahl.synaptik.domain.TaskPriority;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskResourceTest {

    private static String createdTaskId;

    @Test
    @Order(1)
    public void testGetAllTasks() {
        given()
            .when().get("/api/tasks")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    @Order(2)
    public void testCreateTask() {
        String taskJson = """
            {
                "title": "Test Task",
                "description": "This is a test task",
                "status": "PENDING",
                "priority": "HIGH",
                "project": "TestProject",
                "assignee": "testuser",
                "tags": ["test", "important"]
            }
            """;

        createdTaskId = given()
            .contentType(ContentType.JSON)
            .body(taskJson)
            .when().post("/api/tasks")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("title", is("Test Task"))
                .body("description", is("This is a test task"))
                .body("status", is("PENDING"))
                .body("priority", is("HIGH"))
                .body("project", is("TestProject"))
                .body("assignee", is("testuser"))
                .body("id", notNullValue())
                .body("createdAt", notNullValue())
                .body("updatedAt", notNullValue())
                .body("urgency", notNullValue())
            .extract().path("id");
    }

    @Test
    @Order(3)
    public void testGetTaskById() {
        given()
            .when().get("/api/tasks/" + createdTaskId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("title", is("Test Task"))
                .body("id", is(createdTaskId));
    }

    @Test
    @Order(4)
    public void testUpdateTask() {
        String updateJson = """
            {
                "title": "Updated Test Task",
                "description": "This task has been updated",
                "priority": "MEDIUM"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/tasks/" + createdTaskId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("title", is("Updated Test Task"))
                .body("description", is("This task has been updated"))
                .body("priority", is("MEDIUM"));
    }

    @Test
    @Order(5)
    public void testStartTask() {
        given()
            .when().post("/api/tasks/" + createdTaskId + "/start")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("ACTIVE"));
    }

    @Test
    @Order(6)
    public void testStopTask() {
        given()
            .when().post("/api/tasks/" + createdTaskId + "/stop")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("PENDING"));
    }

    @Test
    @Order(7)
    public void testMarkTaskDone() {
        given()
            .when().post("/api/tasks/" + createdTaskId + "/done")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("COMPLETED"));
    }

    @Test
    @Order(8)
    public void testGetPendingTasks() {
        given()
            .when().get("/api/tasks/pending")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(9)
    public void testGetActiveTasks() {
        given()
            .when().get("/api/tasks/active")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(10)
    public void testGetCompletedTasks() {
        given()
            .when().get("/api/tasks/completed")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(11)
    public void testGetOverdueTasks() {
        given()
            .when().get("/api/tasks/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(12)
    public void testGetTodayTasks() {
        given()
            .when().get("/api/tasks/today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(13)
    public void testDeleteTask() {
        given()
            .when().delete("/api/tasks/" + createdTaskId)
            .then()
                .statusCode(204);
    }

    @Test
    @Order(14)
    public void testGetNonExistentTask() {
        given()
            .when().get("/api/tasks/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(15)
    public void testUpdateNonExistentTask() {
        String updateJson = """
            {
                "title": "Non-existent Task"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/tasks/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(16)
    public void testDeleteNonExistentTask() {
        given()
            .when().delete("/api/tasks/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(17)
    public void testCreateInvalidTask() {
        String invalidTaskJson = """
            {
                "description": "Task without title"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(invalidTaskJson)
            .when().post("/api/tasks")
            .then()
                .statusCode(400);
    }
}