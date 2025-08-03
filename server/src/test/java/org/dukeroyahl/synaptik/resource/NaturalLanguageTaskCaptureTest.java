package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.anyOf;

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

    // NEGATIVE TEST CASES
    
    @Test
    @Order(11)
    public void testEmptyInput() {
        String input = "";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(400)
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 1: Empty Input ===");
        System.out.println("Input: '" + input + "'");
        System.out.println("Response Status: " + response.getStatusCode());
        System.out.println("Response: " + response.asString());
        System.out.println("=====================================\n");
    }
    
    @Test
    @Order(12)
    public void testWhitespaceOnlyInput() {
        String input = "   \n\t   ";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(400)
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 2: Whitespace Only ===");
        System.out.println("Input: '" + input + "'");
        System.out.println("Response Status: " + response.getStatusCode());
        System.out.println("Response: " + response.asString());
        System.out.println("=====================================\n");
    }
    
    @Test
    @Order(13)
    public void testVeryLongInput() {
        StringBuilder longInput = new StringBuilder();
        for (int i = 0; i < 1000; i++) {
            longInput.append("This is a very long task description that might cause issues. ");
        }
        String input = longInput.toString();
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(anyOf(is(201), is(400), is(413))) // Accept created, bad request, or payload too large
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 3: Very Long Input ===");
        System.out.println("Input Length: " + input.length() + " characters");
        System.out.println("Response Status: " + response.getStatusCode());
        System.out.println("Response: " + response.asString().substring(0, Math.min(200, response.asString().length())) + "...");
        System.out.println("=========================================\n");
    }
    
    @Test
    @Order(14)
    public void testSpecialCharactersInput() {
        String input = "Task with special chars: @#$%^&*(){}[]|\\:;\"'<>?,./~`!";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 4: Special Characters ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("==========================================\n");
    }
    
    @Test
    @Order(15)
    public void testUnicodeInput() {
        String input = "Встреча с 张三 в café à 15h00 pour discuter du 项目";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 5: Unicode/Multilingual ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("==========================================\n");
    }
    
    @Test
    @Order(16)
    public void testInvalidTimeFormat() {
        String input = "Meeting at 25:70 tomorrow";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201) // Should still create task, just ignore invalid time
            .contentType("application/json")
            .body("title", notNullValue())
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 6: Invalid Time Format ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Due Date: " + response.path("dueDate")); // Should be null or default
        System.out.println("==========================================\n");
    }
    
    @Test
    @Order(17)
    public void testMalformedTaskWarriorSyntax() {
        String input = "Task due: +tag priority: project:";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201) // Should handle gracefully
            .contentType("application/json")
            .body("title", notNullValue())
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 7: Malformed TaskWarrior Syntax ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("Priority: " + response.path("priority"));
        System.out.println("Project: " + response.path("project"));
        System.out.println("================================================\n");
    }
    
    @Test
    @Order(18)
    public void testNullInput() {
        // Test without body parameter to simulate null input
        given()
            .contentType("text/plain")
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(400); // Should return bad request for null input

        System.out.println("\n=== Negative Test 8: Null Input ===");
        System.out.println("Input: (no body)");
        System.out.println("Expected: 400 Bad Request");
        System.out.println("=====================================\n");
    }    @Test
    @Order(19)
    public void testNumericOnlyInput() {
        String input = "123456789";
        
        Response response = given()
            .contentType("text/plain")
            .body(input)
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(201)
            .contentType("application/json")
            .body("title", notNullValue())
            .extract()
            .response();
        
        System.out.println("\n=== Negative Test 9: Numeric Only Input ===");
        System.out.println("Input: " + input);
        System.out.println("Created Task: " + response.asString());
        System.out.println("Title: " + response.path("title"));
        System.out.println("==========================================\n");
    }
    
    @Test
    @Order(20)
    public void testInvalidContentType() {
        String input = "Valid task description";
        
        given()
            .contentType("application/json") // Wrong content type
            .body("{\"text\": \"" + input + "\"}")
            .when()
            .post("/api/tasks/capture")
            .then()
            .statusCode(415); // Unsupported Media Type
        
        System.out.println("\n=== Negative Test 10: Invalid Content Type ===");
        System.out.println("Input: " + input);
        System.out.println("Content-Type: application/json (should be text/plain)");
        System.out.println("Expected: 415 Unsupported Media Type");
        System.out.println("===============================================\n");
    }
}
