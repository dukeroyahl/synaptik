package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProjectResourceTest {

    private static String createdProjectId;

    @Test
    @Order(1)
    public void testGetAllProjects() {
        given()
            .when().get("/api/projects")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    @Order(2)
    public void testCreateProject() {
        String projectJson = """
            {
                "name": "Test Project",
                "description": "This is a test project",
                "status": "PLANNING",
                "progress": 0.0,
                "color": "#FF5733",
                "owner": "testowner",
                "members": ["user1", "user2"],
                "tags": ["development", "test"]
            }
            """;

        createdProjectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("name", is("Test Project"))
                .body("description", is("This is a test project"))
                .body("status", is("PLANNING"))
                .body("progress", is(0.0f))
                .body("color", is("#FF5733"))
                .body("owner", is("testowner"))
                .body("id", notNullValue())
                .body("createdAt", notNullValue())
                .body("updatedAt", notNullValue())
            .extract().path("id");
    }

    @Test
    @Order(3)
    public void testGetProjectById() {
        given()
            .when().get("/api/projects/" + createdProjectId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("name", is("Test Project"))
                .body("id", is(createdProjectId));
    }

    @Test
    @Order(4)
    public void testUpdateProject() {
        String updateJson = """
            {
                "name": "Updated Test Project",
                "description": "This project has been updated",
                "color": "#33FF57"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/projects/" + createdProjectId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("name", is("Updated Test Project"))
                .body("description", is("This project has been updated"))
                .body("color", is("#33FF57"));
    }

    @Test
    @Order(5)
    public void testActivateProject() {
        given()
            .when().post("/api/projects/" + createdProjectId + "/activate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("ACTIVE"))
                .body("startDate", notNullValue());
    }

    @Test
    @Order(6)
    public void testUpdateProjectProgress() {
        given()
            .queryParam("progress", 75.5)
            .when().put("/api/projects/" + createdProjectId + "/progress")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("progress", is(75.5f));
    }

    @Test
    @Order(7)
    public void testPutProjectOnHold() {
        given()
            .when().post("/api/projects/" + createdProjectId + "/hold")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("ON_HOLD"));
    }

    @Test
    @Order(8)
    public void testCompleteProject() {
        given()
            .when().post("/api/projects/" + createdProjectId + "/complete")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", is("COMPLETED"))
                .body("progress", is(100.0f))
                .body("endDate", notNullValue());
    }

    @Test
    @Order(9)
    public void testGetProjectsByStatus() {
        given()
            .when().get("/api/projects/status/COMPLETED")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(10)
    public void testGetProjectsByOwner() {
        given()
            .when().get("/api/projects/owner/testowner")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(11)
    public void testGetActiveProjects() {
        given()
            .when().get("/api/projects/active")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(12)
    public void testGetOverdueProjects() {
        given()
            .when().get("/api/projects/overdue")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(13)
    public void testGetProjectsByTag() {
        given()
            .when().get("/api/projects/tag/development")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(14)
    public void testDeleteProject() {
        given()
            .when().delete("/api/projects/" + createdProjectId)
            .then()
                .statusCode(204);
    }

    @Test
    @Order(15)
    public void testGetNonExistentProject() {
        given()
            .when().get("/api/projects/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(16)
    public void testUpdateNonExistentProject() {
        String updateJson = """
            {
                "name": "Non-existent Project"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/projects/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(17)
    public void testDeleteNonExistentProject() {
        given()
            .when().delete("/api/projects/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(18)
    public void testActivateNonExistentProject() {
        given()
            .when().post("/api/projects/507f1f77bcf86cd799439011/activate")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(19)
    public void testCompleteNonExistentProject() {
        given()
            .when().post("/api/projects/507f1f77bcf86cd799439011/complete")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(20)
    public void testCreateInvalidProject() {
        String invalidProjectJson = """
            {
                "description": "Project without name"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(invalidProjectJson)
            .when().post("/api/projects")
            .then()
                .statusCode(400);
    }

    @Test
    @Order(21)
    public void testUpdateProgressWithInvalidValue() {
        String projectJson = """
            {
                "name": "Progress Test Project",
                "description": "For testing progress updates"
            }
            """;

        String testProjectId = given()
            .contentType(ContentType.JSON)
            .body(projectJson)
            .when().post("/api/projects")
            .then()
                .statusCode(201)
                .extract().path("id");

        // Test progress > 100
        given()
            .queryParam("progress", 150.0)
            .when().put("/api/projects/" + testProjectId + "/progress")
            .then()
                .statusCode(200)
                .body("progress", is(100.0f))
                .body("status", is("COMPLETED"));

        // Clean up
        given()
            .when().delete("/api/projects/" + testProjectId)
            .then()
                .statusCode(204);
    }
}