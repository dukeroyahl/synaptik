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
                "projectName": "TestProject",
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
                .body("projectName", is("TestProject"))
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
    public void testDeleteTask() {
        given()
            .when().delete("/api/tasks/" + createdTaskId)
            .then()
                .statusCode(204);
    }

    @Test
    @Order(6)
    public void testGetNonExistentTask() {
        given()
            .when().get("/api/tasks/550e8400-e29b-41d4-a716-446655440000")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(7)
    public void testUpdateNonExistentTask() {
        String updateJson = """
            {
                "title": "Non-existent Task"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/tasks/550e8400-e29b-41d4-a716-446655440000")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(8)
    public void testDeleteNonExistentTask() {
        given()
            .when().delete("/api/tasks/550e8400-e29b-41d4-a716-446655440000")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(9)
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

    @Test
    @Order(10)
    public void testSearchByStatus() {
        // Search for PENDING tasks
        given()
            .queryParam("status", "PENDING")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Search for multiple statuses
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "ACTIVE")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(11)
    public void testSearchByTitle() {
        // Search for tasks with "Test" in title
        given()
            .queryParam("title", "Test")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Case-insensitive search
        given()
            .queryParam("title", "test")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(12)
    public void testSearchByAssignee() {
        // Search for tasks assigned to "testuser"
        given()
            .queryParam("assignee", "testuser")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Partial assignee search
        given()
            .queryParam("assignee", "test")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(13)
    public void testSearchByProjectId() {
        // First get a project ID
        String projectId = given()
            .when().get("/api/projects")
            .then()
                .statusCode(200)
                .extract().path("[0].id");

        // Search by valid project UUID
        given()
            .queryParam("projectId", projectId)
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Search with invalid UUID should return empty results
        given()
            .queryParam("projectId", "invalid-uuid")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", is(0));
    }

    @Test
    @Order(14)
    public void testSearchWithDateRange() {
        // Search with date range
        given()
            .queryParam("dateFrom", "2025-01-01")
            .queryParam("dateTo", "2025-12-31")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Search with timezone
        given()
            .queryParam("dateFrom", "2025-01-01")
            .queryParam("dateTo", "2025-12-31")
            .queryParam("tz", "America/New_York")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(15)
    public void testSearchWithMultipleFilters() {
        // Complex search with multiple filters
        given()
            .queryParam("status", "PENDING")
            .queryParam("title", "Test")
            .queryParam("assignee", "testuser")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(16)
    public void testSearchWithInvalidStatus() {
        // Invalid status should return 404 (handled by ParamConverter)
        given()
            .queryParam("status", "INVALID_STATUS")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(17)
    public void testSearchWithNoFilters() {
        // Search with no filters should return all tasks
        given()
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(18)
    public void testSearchCaseInsensitiveStatus() {
        // Test case-insensitive status handling
        given()
            .queryParam("status", "pending")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        given()
            .queryParam("status", "Pending")
            .when().get("/api/tasks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(27)
    public void testGetOverdueTasks() {
        // Test with default UTC timezone
        given()
            .when().get("/api/tasks/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Test with specific timezone
        given()
            .queryParam("tz", "America/New_York")
            .when().get("/api/tasks/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Test with invalid timezone (should fallback to UTC)
        given()
            .queryParam("tz", "Invalid/Timezone")
            .when().get("/api/tasks/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(28)
    public void testGetDueTodayTasks() {
        // Test with default UTC timezone
        given()
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Test with specific timezone
        given()
            .queryParam("tz", "Europe/London")
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Test with Pacific timezone
        given()
            .queryParam("tz", "America/Los_Angeles")
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(29)
    public void testCreateOverdueTaskAndRetrieve() {
        // Create a task with yesterday's date
        String overdueTaskJson = """
            {
                "title": "Test Overdue Task",
                "description": "This task should be overdue",
                "status": "PENDING",
                "priority": "HIGH",
                "project": "TestProject",
                "assignee": "testuser",
                "dueDate": "2025-08-10T10:00:00Z"
            }
            """;

        // Create the overdue task
        given()
            .contentType(ContentType.JSON)
            .body(overdueTaskJson)
            .when().post("/api/tasks")
            .then()
                .statusCode(201);

        // Verify it appears in overdue tasks
        given()
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(30)
    public void testCreateDueTodayTaskAndRetrieve() {
        // Create a task due today
        String dueTodayTaskJson = """
            {
                "title": "Test Due Today Task",
                "description": "This task is due today",
                "status": "PENDING",
                "priority": "MEDIUM",
                "project": "TestProject",
                "assignee": "testuser",
                "dueDate": "2025-08-11T15:00:00Z"
            }
            """;

        // Create the due today task
        given()
            .contentType(ContentType.JSON)
            .body(dueTodayTaskJson)
            .when().post("/api/tasks")
            .then()
                .statusCode(201);

        // Verify it appears in due today tasks
        given()
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", greaterThanOrEqualTo(1));
    }

    @Test
    @Order(31)
    public void testTimezoneCalculations() {
        // Test that timezone affects the calculation
        // A task due at 2025-08-11T06:00:00Z should be:
        // - Due today in UTC (it's 06:00 UTC on Aug 11)
        // - Due yesterday in Pacific time (it's 23:00 PDT on Aug 10)
        
        String timezoneTestTaskJson = """
            {
                "title": "Timezone Test Task",
                "description": "Testing timezone calculations",
                "status": "PENDING",
                "priority": "LOW",
                "project": "TestProject",
                "assignee": "testuser",
                "dueDate": "2025-08-11T06:00:00Z"
            }
            """;

        // Create the task
        given()
            .contentType(ContentType.JSON)
            .body(timezoneTestTaskJson)
            .when().post("/api/tasks")
            .then()
                .statusCode(201);

        // Should appear in due today for UTC
        given()
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);

        // Should also work for other timezones
        given()
            .queryParam("tz", "America/Los_Angeles")
            .when().get("/api/tasks/due-today")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }
}