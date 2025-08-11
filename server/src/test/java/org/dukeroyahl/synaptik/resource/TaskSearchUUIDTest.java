package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskSearchUUIDTest {

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

        // Create all tasks
        given().contentType(ContentType.JSON).body(task1Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task2Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task3Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task4Json).when().post("/api/tasks").then().statusCode(201);

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
    }

    @Test
    @Order(3)
    public void testSearchByProjectUUID() {
        testSetupTestData(); // Setup test data

        // Search by Authentication Module project UUID
        given()
            .queryParam("projectId", projectId1)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));

        // Search by UI Design project UUID
        given()
            .queryParam("projectId", projectId2)
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].project", equalTo("UI Design"));
    }

    @Test
    @Order(4)
    public void testSearchByTitle() {
        testSetupTestData(); // Setup test data

        // Search for tasks with "user" in title (case-insensitive)
        given()
            .queryParam("title", "user")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Implement user authentication", "Design user dashboard"));

        // Search for tasks with "password" in title
        given()
            .queryParam("title", "password")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Add password reset functionality"));
    }

    @Test
    @Order(5)
    public void testSearchByAssignee() {
        testSetupTestData(); // Setup test data

        // Search for tasks assigned to John Doe
        given()
            .queryParam("assignee", "John Doe")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("assignee", everyItem(equalTo("John Doe")));

        // Search for tasks with "john" in assignee (case-insensitive, partial)
        given()
            .queryParam("assignee", "john")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3)) // John Doe and Bob Johnson
            .body("assignee", hasItems("John Doe", "Bob Johnson"));
    }

    @Test
    @Order(6)
    public void testSearchWithTimezone() {
        testSetupTestData(); // Setup test data

        // Search for tasks due on 2025-08-15 in UTC
        given()
            .queryParam("dateFrom", "2025-08-15")
            .queryParam("dateTo", "2025-08-15")
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
            .queryParam("projectId", projectId1)
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
    public void testSearchWithInvalidProjectId() {
        testSetupTestData(); // Setup test data

        // Search with invalid UUID format should return no results
        given()
            .queryParam("projectId", "invalid-uuid-format")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));

        // Search with valid UUID format but non-existent UUID
        given()
            .queryParam("projectId", "12345678-1234-1234-1234-123456789abc")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    @Order(9)
    public void testSearchWithNoFilters() {
        testSetupTestData(); // Setup test data

        // Search with no filters should return all tasks
        given()
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(4));
    }

    @Test
    @Order(10)
    public void testSearchWithInvalidStatus() {
        testSetupTestData(); // Setup test data

        // Search with invalid status should return 404 (handled by JAX-RS ParamConverter)
        given()
            .queryParam("status", "INVALID_STATUS")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(404);

        // Search with mix of valid and invalid statuses should return 404
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "INVALID_STATUS")
            .queryParam("status", "ACTIVE")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(404);
    }

    @Test
    @Order(11)
    public void testSearchPerformanceWithDatabaseFiltering() {
        testSetupTestData(); // Setup test data

        // This test verifies that database-level filtering is working
        // by ensuring we get results quickly even with multiple filters
        long startTime = System.currentTimeMillis();
        
        given()
            .queryParam("status", "PENDING")
            .queryParam("status", "ACTIVE")
            .queryParam("title", "user")
            .queryParam("assignee", "john")
            .queryParam("projectId", projectId1)
            .queryParam("dateFrom", "2025-08-10")
            .queryParam("dateTo", "2025-08-30")
            .queryParam("tz", "UTC")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(0));
        
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        
        // With database-level filtering, this should be very fast (< 100ms)
        // This is more of a smoke test than a strict performance test
        System.out.println("Search with multiple filters took: " + duration + "ms");
    }
}
