package com.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class TaskResourceTest {
    
    @Test
    public void testHealthEndpoint() {
        given()
            .when().get("/health")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }
    
    @Test
    public void testGetAllTasks() {
        given()
            .when().get("/api/tasks")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
    }
}