package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TaskSearchTest {

    @BeforeEach
    public void setup() {
        // Clean up before each test
        given().when().delete("/api/tasks").then().statusCode(204);
        given().when().delete("/api/projects").then().statusCode(204);
    }

    @Test
    @Order(1)
    public void testSearchTasksSetup() {
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

        // Task 5: No project, no assignee, no due date
        String task5Json = """
            {
                "title": "Review code standards",
                "description": "Update coding guidelines",
                "priority": "MEDIUM",
                "status": "PENDING"
            }
            """;

        // Create all tasks
        given().contentType(ContentType.JSON).body(task1Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task2Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task3Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task4Json).when().post("/api/tasks").then().statusCode(201);
        given().contentType(ContentType.JSON).body(task5Json).when().post("/api/tasks").then().statusCode(201);

        // Verify all tasks were created
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("size()", equalTo(5));
    }

    @Test
    @Order(2)
    public void testSearchByStatus() {
        testSearchTasksSetup(); // Setup test data

        // Search for PENDING tasks
        given()
            .queryParam("status", "PENDING")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(3))
            .body("status", everyItem(equalTo("PENDING")));

        // Search for ACTIVE tasks
        given()
            .queryParam("status", "ACTIVE")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].status", equalTo("ACTIVE"))
            .body("[0].title", equalTo("Add password reset functionality"));

        // Search for COMPLETED tasks
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
    public void testSearchByTitle() {
        testSearchTasksSetup(); // Setup test data

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

        // Search for non-existent title
        given()
            .queryParam("title", "nonexistent")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    @Order(4)
    public void testSearchByAssignee() {
        testSearchTasksSetup(); // Setup test data

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

        // Search for tasks with "smith" in assignee
        given()
            .queryParam("assignee", "smith")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].assignee", equalTo("Jane Smith"));
    }

    @Test
    @Order(5)
    public void testSearchByProject() {
        testSearchTasksSetup(); // Setup test data

        // Search for tasks in "Authentication Module" project
        given()
            .queryParam("project", "Authentication Module")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));

        // Search for tasks with "auth" in project name (case-insensitive, partial)
        given()
            .queryParam("project", "auth")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("project", everyItem(equalTo("Authentication Module")));

        // Search for tasks with "design" in project name
        given()
            .queryParam("project", "design")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].project", equalTo("UI Design"));
    }

    @Test
    @Order(6)
    public void testSearchByDateRange() {
        testSearchTasksSetup(); // Setup test data

        // Search for tasks due between 2025-08-14 and 2025-08-16
        given()
            .queryParam("dateFrom", "2025-08-14")
            .queryParam("dateTo", "2025-08-16")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));

        // Search for tasks due from 2025-08-20 onwards
        given()
            .queryParam("dateFrom", "2025-08-20")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Add password reset functionality", "Design user dashboard"));

        // Search for tasks due before 2025-08-15
        given()
            .queryParam("dateTo", "2025-08-15")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Migrate user database", "Implement user authentication"));
    }

    @Test
    @Order(7)
    public void testSearchWithMultipleFilters() {
        testSearchTasksSetup(); // Setup test data

        // Search for PENDING tasks assigned to John Doe
        given()
            .queryParam("status", "PENDING")
            .queryParam("assignee", "John Doe")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("status", everyItem(equalTo("PENDING")))
            .body("assignee", everyItem(equalTo("John Doe")));

        // Search for tasks in Authentication Module with ACTIVE status
        given()
            .queryParam("status", "ACTIVE")
            .queryParam("project", "Authentication")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].status", equalTo("ACTIVE"))
            .body("[0].project", equalTo("Authentication Module"));

        // Complex search: PENDING tasks with "user" in title, assigned to John, due before 2025-08-20
        given()
            .queryParam("status", "PENDING")
            .queryParam("title", "user")
            .queryParam("assignee", "John")
            .queryParam("dateTo", "2025-08-20")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Implement user authentication"));
    }

    @Test
    @Order(8)
    public void testSearchWithNoFilters() {
        testSearchTasksSetup(); // Setup test data

        // Search with no filters should return all tasks
        given()
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(5));
    }

    @Test
    @Order(9)
    public void testSearchWithInvalidStatus() {
        testSearchTasksSetup(); // Setup test data

        // Search with invalid status should return no results
        given()
            .queryParam("status", "INVALID_STATUS")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0));
    }

    @Test
    @Order(10)
    public void testSearchWithInvalidDateFormat() {
        testSearchTasksSetup(); // Setup test data

        // Search with invalid date format should return tasks without date filtering
        given()
            .queryParam("dateFrom", "invalid-date")
            .queryParam("title", "user")
            .when().get("/api/tasks/search")
            .then()
            .statusCode(200)
            .body("size()", equalTo(0)); // No tasks match because invalid date excludes all tasks with due dates
    }
}
