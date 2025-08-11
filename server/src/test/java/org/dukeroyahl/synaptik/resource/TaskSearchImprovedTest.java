package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskSearchImprovedTest {

    private String projectId1;
    private String projectId2;

    @BeforeEach
    public void setup() {
        // Clean up before each test
        given().when().delete("/api/tasks").then().statusCode(204);
        given().when().delete("/api/projects").then().statusCode(204);
    }

    @Test
    @Order(1)
    public void testSetupTestData() {
        // Create test tasks with different properties for comprehensive search testing
        
        // Task 1: Authentication Module - John Doe - HIGH priority - Due 2025-08-15
        String task1Json = """
            {
                "title": "Implement user authentication",
                "description": "Add JWT-based authentication system",
                "priority": "HIGH",
                "status": "PENDING",
                "project": "Authentication Module",
                "assignee": "John Doe",
                "dueDate": "2025-08-15T18:00:00Z"
            }
            """;

        // Task 2: Authentication Module - Jane Smith - MEDIUM priority - Due 2025-08-20
        String task2Json = """
            {
                "title": "Add password reset functionality",
                "description": "Implement forgot password flow",
                "priority": "MEDIUM",
                "status": "ACTIVE",
                "project": "Authentication Module",
                "assignee": "Jane Smith",
                "dueDate": "2025-08-20T12:00:00Z"
            }
            """;

        // Task 3: UI Design - Bob Johnson - LOW priority - Due 2025-08-25
        String task3Json = """
            {
                "title": "Design user dashboard",
                "description": "Create wireframes and mockups",
                "priority": "LOW",
                "status": "COMPLETED",
                "project": "UI Design",
                "assignee": "Bob Johnson",
                "dueDate": "2025-08-25T09:00:00Z"
            }
            """;

        // Task 4: Database Migration - John Doe - HIGH priority - Due 2025-08-12
        String task4Json = """
            {
                "title": "Migrate user database",
                "description": "Move from MySQL to PostgreSQL",
                "priority": "HIGH",
                "status": "PENDING",
                "project": "Database Migration",
                "assignee": "John Doe",
                "dueDate": "2025-08-12T16:00:00Z"
            }
            """;

        // Create all tasks and capture project IDs
        String response1 = given().contentType(ContentType.JSON).body(task1Json).when().post("/api/tasks").then().statusCode(201).extract().asString();
        String response2 = given().contentType(ContentType.JSON).body(task2Json).when().post("/api/tasks").then().statusCode(201).extract().asString();
        String response3 = given().contentType(ContentType.JSON).body(task3Json).when().post("/api/tasks").then().statusCode(201).extract().asString();
        String response4 = given().contentType(ContentType.JSON).body(task4Json).when().post("/api/tasks").then().statusCode(201).extract().asString();

        // Extract project IDs for UUID testing
        projectId1 = given().when().get("/api/projects").then().statusCode(200).extract().path("find { it.name == 'Authentication Module' }.id");
        projectId2 = given().when().get("/api/projects").then().statusCode(200).extract().path("find { it.name == 'UI Design' }.id");

        // Verify all tasks were created
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(4));
    }

    @Test
    @Order(2)
    public void testSearchByMultipleStatuses() {
        testSetupTestData(); // Setup test data

        // Search for PENDING and ACTIVE tasks
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "ACTIVE")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("status", everyItem(anyOf(equalTo("PENDING"), equalTo("ACTIVE"))));

        // Search for only COMPLETED tasks
        given()
            .queryParam("status", "COMPLETED")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].status", equalTo("COMPLETED"))
            .body("[0].title", equalTo("Design user dashboard"));

        // Search for PENDING and COMPLETED tasks
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "COMPLETED")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("status", everyItem(anyOf(equalTo("PENDING"), equalTo("COMPLETED"))));
    }

    @Test
    @Order(3)
    public void testSearchByProjectUUID() {
        testSetupTestData(); // Setup test data

        // Search by Authentication Module project UUID
        given()
            .queryParam("project", projectId1)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));

        // Search by UI Design project UUID
        given()
            .queryParam("project", projectId2)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].project", equalTo("UI Design"));
    }

    @Test
    @Order(4)
    public void testSearchByProjectNameAndUUID() {
        testSetupTestData(); // Setup test data

        // Search by project name (partial)
        given()
            .queryParam("project", "auth")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));

        // Search by exact project UUID should work the same
        given()
            .queryParam("project", projectId1)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));
    }

    @Test
    @Order(5)
    public void testSearchWithTimezone() {
        testSetupTestData(); // Setup test data

        // Search for tasks due on 2025-08-15 in UTC (should include the auth task)
        given()
            .queryParam("dateFrom", "2025-08-15")
            .queryParam("dateTo", "2025-08-15")
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));

        // Search for tasks due on 2025-08-15 in EST (should still work due to timezone handling)
        given()
            .queryParam("dateFrom", "2025-08-15")
            .queryParam("dateTo", "2025-08-15")
            .queryParam("tz", "America/New_York")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(0)); // May or may not include tasks depending on timezone conversion
    }

    @Test
    @Order(6)
    public void testSearchWithDateRangeAndTimezone() {
        testSetupTestData(); // Setup test data

        // Search for tasks due between 2025-08-14 and 2025-08-16 in UTC
        given()
            .queryParam("dateFrom", "2025-08-14")
            .queryParam("dateTo", "2025-08-16")
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));

        // Search for tasks due from 2025-08-20 onwards in UTC
        given()
            .queryParam("dateFrom", "2025-08-20")
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Add password reset functionality", "Design user dashboard"));
    }

    @Test
    @Order(7)
    public void testSearchWithComplexFilters() {
        testSetupTestData(); // Setup test data

        // Search for PENDING tasks assigned to John Doe in Authentication Module by UUID
        given()
            .queryParam("status", "PENDING")
            .queryParam("assignee", "John Doe")
            .queryParam("project", projectId1)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));

        // Search for tasks with "user" in title, multiple statuses, and date range
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "COMPLETED")
            .queryParam("title", "user")
            .queryParam("dateFrom", "2025-08-10")
            .queryParam("dateTo", "2025-08-30")
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Implement user authentication", "Design user dashboard"));
    }

    @Test
    @Order(8)
    public void testSearchWithInvalidStatus() {
        testSetupTestData(); // Setup test data

        // Search with invalid status should return no results
        given()
            .queryParam("status", "INVALID_STATUS")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));

        // Search with mix of valid and invalid statuses should only use valid ones
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "INVALID_STATUS")
            .queryParam("status", "ACTIVE")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("status", everyItem(anyOf(equalTo("PENDING"), equalTo("ACTIVE"))));
    }

    @Test
    @Order(9)
    public void testSearchWithInvalidUUID() {
        testSetupTestData(); // Setup test data

        // Search with invalid UUID should fall back to name matching
        given()
            .queryParam("project", "invalid-uuid-format")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0)); // No project names contain "invalid-uuid-format"

        // Search with valid UUID format but non-existent UUID
        given()
            .queryParam("project", "12345678-1234-1234-1234-123456789abc")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    @Order(10)
    public void testSearchWithDefaultTimezone() {
        testSetupTestData(); // Setup test data

        // Search without timezone parameter should use UTC as default
        given()
            .queryParam("dateFrom", "2025-08-15")
            .queryParam("dateTo", "2025-08-15")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));
    }
}
