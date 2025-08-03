package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class NaturalLanguageTaskCaptureTest {

    @Test
    @Order(1)
    public void testNaturalLanguageMeetingWithTime() {
        String input = "Meet with Sarah tomorrow at 3pm about the project";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 1: Natural Language Meeting ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Assignee: " + response.path("assignee"));
        System.out.println("Due Date: " + response.path("dueDate"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("============================================\n");
    }

    @Test
    @Order(2)
    public void testNaturalLanguageUrgentTask() {
        String input = "Send urgent email to client about proposal";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("priority", notNullValue())
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 2: Natural Language Urgent Task ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Priority: " + response.path("priority"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("=============================================\n");
    }

    @Test
    @Order(3)
    public void testNaturalLanguageSimpleTask() {
        String input = "Review code next Friday";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 3: Natural Language Simple Task ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Due Date: " + response.path("dueDate"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("=============================================\n");
    }

    @Test
    @Order(4)
    public void testTaskWarriorSyntaxCompatibility() {
        String input = "Buy groceries due:tomorrow +shopping priority:H";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", is("Buy groceries"))
            .body("priority", is("HIGH"))
            .body("dueDate", notNullValue())
            .body("tags", hasItem("shopping"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 4: TaskWarrior Syntax Compatibility ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Priority: " + response.path("priority"));
        System.out.println("Due Date: " + response.path("dueDate"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("================================================\n");
    }

    @Test
    @Order(5)
    public void testNaturalLanguageWithAssignee() {
        String input = "Call John about the marketing campaign";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 5: Natural Language with Assignee ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Assignee: " + response.path("assignee"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("===============================================\n");
    }

    @Test
    @Order(6)
    public void testNaturalLanguageCriticalPriority() {
        String input = "Fix critical bug in login system";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("priority", is("HIGH"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 6: Natural Language Critical Priority ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Priority: " + response.path("priority"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("===================================================\n");
    }

    @Test
    @Order(7)
    public void testNaturalLanguageWithProject() {
        String input = "Update documentation for the mobile app project";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 7: Natural Language with Project ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("==============================================\n");
    }

    @Test
    @Order(8)
    public void testNaturalLanguageComplexMeeting() {
        String input = "Schedule urgent team meeting for next Monday at 2pm regarding the product launch";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 8: Natural Language Complex Meeting ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Priority: " + response.path("priority"));
        System.out.println("Due Date: " + response.path("dueDate"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("=================================================\n");
    }

    @Test
    @Order(9)
    public void testNaturalLanguageEmailTask() {
        String input = "Send follow-up email to client about contract renewal";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 9: Natural Language Email Task ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("============================================\n");
    }

    @Test
    @Order(10)
    public void testNaturalLanguageWithTime() {
        String input = "Prepare presentation for tomorrow at 10am";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .body("status", is("PENDING"))
            .extract()
            .response();
        
        // Print the created task for verification
        System.out.println("\n=== Test 10: Natural Language with Time ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Due Date: " + response.path("dueDate"));
        System.out.println("Tags: " + response.path("tags"));
        System.out.println("===========================================\n");
    }
}
