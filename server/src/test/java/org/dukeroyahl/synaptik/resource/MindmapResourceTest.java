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
public class MindmapResourceTest {

    private static String createdMindmapId;
    private static String nodeId = "node-123";

    @Test
    @Order(1)
    public void testGetAllMindmaps() {
        given()
            .when().get("/api/mindmaps")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("size()", greaterThanOrEqualTo(0));
    }

    @Test
    @Order(2)
    public void testCreateMindmap() {
        String mindmapJson = """
            {
                "title": "Test Mindmap",
                "description": "This is a test mindmap",
                "owner": "testowner",
                "collaborators": ["user1", "user2"],
                "tags": ["brainstorming", "test"],
                "projectId": "project123",
                "isPublic": false,
                "allowEdit": true,
                "allowComment": true,
                "isTemplate": false,
                "zoom": 1.0,
                "panX": 0.0,
                "panY": 0.0,
                "rootNode": {
                    "id": "root-1",
                    "text": "Central Idea",
                    "color": "#000000",
                    "backgroundColor": "#FFFFFF",
                    "x": 100.0,
                    "y": 100.0,
                    "width": 150.0,
                    "height": 50.0,
                    "shape": "rectangle",
                    "fontSize": "14px",
                    "fontFamily": "Arial",
                    "bold": false,
                    "italic": false,
                    "tags": ["central"],
                    "notes": "This is the main idea",
                    "children": []
                }
            }
            """;

        createdMindmapId = given()
            .contentType(ContentType.JSON)
            .body(mindmapJson)
            .when().post("/api/mindmaps")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("title", is("Test Mindmap"))
                .body("description", is("This is a test mindmap"))
                .body("owner", is("testowner"))
                .body("projectId", is("project123"))
                .body("isPublic", is(false))
                .body("allowEdit", is(true))
                .body("allowComment", is(true))
                .body("isTemplate", is(false))
                .body("id", notNullValue())
                .body("createdAt", notNullValue())
                .body("updatedAt", notNullValue())
                .body("rootNode.text", is("Central Idea"))
            .extract().path("id");
    }

    @Test
    @Order(3)
    public void testGetMindmapById() {
        given()
            .when().get("/api/mindmaps/" + createdMindmapId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("title", is("Test Mindmap"))
                .body("id", is(createdMindmapId));
    }

    @Test
    @Order(4)
    public void testUpdateMindmap() {
        String updateJson = """
            {
                "title": "Updated Test Mindmap",
                "description": "This mindmap has been updated",
                "isPublic": true
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/mindmaps/" + createdMindmapId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("title", is("Updated Test Mindmap"))
                .body("description", is("This mindmap has been updated"))
                .body("isPublic", is(true));
    }

    @Test
    @Order(5)
    public void testAddCollaborator() {
        given()
            .queryParam("collaborator", "newuser")
            .when().post("/api/mindmaps/" + createdMindmapId + "/collaborators")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(6)
    public void testAddNode() {
        String nodeJson = """
            {
                "id": "%s",
                "text": "New Node",
                "color": "#FF5733",
                "backgroundColor": "#FFEEEE",
                "x": 200.0,
                "y": 150.0,
                "width": 120.0,
                "height": 40.0,
                "shape": "ellipse",
                "fontSize": "12px",
                "fontFamily": "Arial",
                "bold": true,
                "italic": false,
                "tags": ["new"],
                "notes": "This is a new node",
                "children": []
            }
            """.formatted(nodeId);

        given()
            .contentType(ContentType.JSON)
            .queryParam("parentId", "root-1")
            .body(nodeJson)
            .when().post("/api/mindmaps/" + createdMindmapId + "/nodes")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(7)
    public void testUpdateCanvasSettings() {
        given()
            .queryParam("width", 1920.0)
            .queryParam("height", 1080.0)
            .queryParam("zoom", 1.5)
            .queryParam("panX", 50.0)
            .queryParam("panY", -20.0)
            .when().put("/api/mindmaps/" + createdMindmapId + "/canvas")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("canvasWidth", is(1920.0f))
                .body("canvasHeight", is(1080.0f))
                .body("zoom", is(1.5f))
                .body("panX", is(50.0f))
                .body("panY", is(-20.0f));
    }

    @Test
    @Order(8)
    public void testDuplicateMindmap() {
        given()
            .queryParam("title", "Duplicated Mindmap")
            .queryParam("owner", "newowner")
            .when().post("/api/mindmaps/" + createdMindmapId + "/duplicate")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("title", is("Duplicated Mindmap"))
                .body("owner", is("newowner"));
    }

    @Test
    @Order(9)
    public void testGetMindmapsByOwner() {
        given()
            .when().get("/api/mindmaps/owner/testowner")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(10)
    public void testGetAccessibleMindmaps() {
        given()
            .when().get("/api/mindmaps/accessible/testowner")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(11)
    public void testGetPublicMindmaps() {
        given()
            .when().get("/api/mindmaps/public")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(12)
    public void testGetTemplates() {
        given()
            .when().get("/api/mindmaps/templates")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(13)
    public void testGetTemplatesByCategory() {
        given()
            .when().get("/api/mindmaps/templates/business")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    // @Test
    // @Order(14)
    // public void testGetMindmapsByProjectId() {
    //     given()
    //         .when().get("/api/mindmaps/project/project123")
    //         .then()
    //             .statusCode(200)
    //             .contentType(ContentType.JSON);
    // }

    @Test
    @Order(15)
    public void testRemoveNode() {
        given()
            .when().delete("/api/mindmaps/" + createdMindmapId + "/nodes/" + nodeId)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(16)
    public void testRemoveCollaborator() {
        given()
            .queryParam("collaborator", "newuser")
            .when().delete("/api/mindmaps/" + createdMindmapId + "/collaborators")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }

    @Test
    @Order(17)
    public void testDeleteMindmap() {
        given()
            .when().delete("/api/mindmaps/" + createdMindmapId)
            .then()
                .statusCode(204);
    }

    @Test
    @Order(18)
    public void testGetNonExistentMindmap() {
        given()
            .when().get("/api/mindmaps/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(19)
    public void testUpdateNonExistentMindmap() {
        String updateJson = """
            {
                "title": "Non-existent Mindmap"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(updateJson)
            .when().put("/api/mindmaps/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(20)
    public void testDeleteNonExistentMindmap() {
        given()
            .when().delete("/api/mindmaps/507f1f77bcf86cd799439011")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(21)
    public void testAddCollaboratorToNonExistentMindmap() {
        given()
            .queryParam("collaborator", "testuser")
            .when().post("/api/mindmaps/507f1f77bcf86cd799439011/collaborators")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(22)
    public void testRemoveCollaboratorFromNonExistentMindmap() {
        given()
            .queryParam("collaborator", "testuser")
            .when().delete("/api/mindmaps/507f1f77bcf86cd799439011/collaborators")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(23)
    public void testAddNodeToNonExistentMindmap() {
        String nodeJson = """
            {
                "id": "test-node",
                "text": "Test Node"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .queryParam("parentId", "root")
            .body(nodeJson)
            .when().post("/api/mindmaps/507f1f77bcf86cd799439011/nodes")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(24)
    public void testRemoveNodeFromNonExistentMindmap() {
        given()
            .when().delete("/api/mindmaps/507f1f77bcf86cd799439011/nodes/test-node")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(25)
    public void testUpdateCanvasSettingsForNonExistentMindmap() {
        given()
            .queryParam("zoom", 2.0)
            .when().put("/api/mindmaps/507f1f77bcf86cd799439011/canvas")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(26)
    public void testDuplicateNonExistentMindmap() {
        given()
            .queryParam("title", "Duplicate")
            .queryParam("owner", "owner")
            .when().post("/api/mindmaps/507f1f77bcf86cd799439011/duplicate")
            .then()
                .statusCode(404);
    }

    @Test
    @Order(27)
    public void testCreateInvalidMindmap() {
        String invalidMindmapJson = """
            {
                "description": "Mindmap without title"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(invalidMindmapJson)
            .when().post("/api/mindmaps")
            .then()
                .statusCode(400);
    }

    @Test
    @Order(28)
    public void testCreateTemplate() {
        String templateJson = """
            {
                "title": "Business Template",
                "description": "A template for business planning",
                "owner": "admin",
                "isTemplate": true,
                "templateCategory": "business",
                "isPublic": true,
                "rootNode": {
                    "id": "template-root",
                    "text": "Business Plan",
                    "children": []
                }
            }
            """;

        String templateId = given()
            .contentType(ContentType.JSON)
            .body(templateJson)
            .when().post("/api/mindmaps")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("title", is("Business Template"))
                .body("isTemplate", is(true))
                .body("templateCategory", is("business"))
            .extract().path("id");

        // Clean up template
        given()
            .when().delete("/api/mindmaps/" + templateId)
            .then()
                .statusCode(204);
    }

    @Test
    @Order(29)
    public void testCanvasZoomLimits() {
        String mindmapJson = """
            {
                "title": "Zoom Test Mindmap",
                "description": "For testing zoom limits",
                "owner": "testowner"
            }
            """;

        String testMindmapId = given()
            .contentType(ContentType.JSON)
            .body(mindmapJson)
            .when().post("/api/mindmaps")
            .then()
                .statusCode(201)
                .extract().path("id");

        // Test zoom beyond max limit (should be clamped to 5.0)
        given()
            .queryParam("zoom", 10.0)
            .when().put("/api/mindmaps/" + testMindmapId + "/canvas")
            .then()
                .statusCode(200)
                .body("zoom", is(5.0f));

        // Test zoom below min limit (should be clamped to 0.1)
        given()
            .queryParam("zoom", 0.05)
            .when().put("/api/mindmaps/" + testMindmapId + "/canvas")
            .then()
                .statusCode(200)
                .body("zoom", is(0.1f));

        // Clean up
        given()
            .when().delete("/api/mindmaps/" + testMindmapId)
            .then()
                .statusCode(204);
    }
}