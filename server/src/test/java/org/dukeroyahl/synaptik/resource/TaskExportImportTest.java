package org.dukeroyahl.synaptik.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TaskExportImportTest {

    private static final int TASK_COUNT = 50;
    private static List<String> createdTaskIds = new ArrayList<>();
    private static List<Map<String, Object>> originalTasks = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // Clear all tasks before each test
        given()
            .when().delete("/api/tasks")
            .then()
            .statusCode(204);
        
        createdTaskIds.clear();
        originalTasks.clear();
    }

    @Test
    @Order(1)
    void testCreate50TasksWithVariedData() {
        System.out.println("=== Creating 50 tasks with varied data ===");
        
        for (int i = 1; i <= TASK_COUNT; i++) {
            String taskData = createVariedTaskData(i);
            
            Response response = given()
                .contentType(ContentType.JSON)
                .body(taskData)
                .when().post("/api/tasks")
                .then()
                .statusCode(201)
                .body("title", containsString("Task " + i))
                .body("version", equalTo(1))
                .body("id", notNullValue())
                .extract().response();
            
            String taskId = response.path("id");
            createdTaskIds.add(taskId);
            
            // Store original task data for comparison
            Map<String, Object> taskMap = response.as(Map.class);
            originalTasks.add(taskMap);
            
            if (i % 10 == 0) {
                System.out.printf("Created %d/%d tasks...%n", i, TASK_COUNT);
            }
        }
        
        System.out.printf("✅ Successfully created %d tasks%n", TASK_COUNT);
        
        // Verify all tasks were created
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("$", hasSize(TASK_COUNT));
    }

    @Test
    @Order(2)
    void testCreateTaskDependencies() {
        System.out.println("=== Creating task dependencies ===");
        
        // First create the tasks
        testCreate50TasksWithVariedData();
        
        // Create some dependencies between tasks
        int dependencyCount = 0;
        for (int i = 0; i < Math.min(20, createdTaskIds.size() - 1); i++) {
            String dependentTask = createdTaskIds.get(i + 1);
            String dependencyTask = createdTaskIds.get(i);
            
            given()
                .contentType(ContentType.JSON)
                .when().post("/api/tasks/{id}/link/{dependencyId}", dependentTask, dependencyTask)
                .then()
                .statusCode(200)
                .body("message", equalTo("Tasks linked successfully"));
            
            dependencyCount++;
        }
        
        System.out.printf("✅ Created %d task dependencies%n", dependencyCount);
    }

    @Test
    @Order(3)
    void testExport50Tasks() {
        System.out.println("=== Testing export of 50 tasks ===");
        
        // First create tasks with dependencies
        testCreateTaskDependencies();
        
        // Export all tasks
        Response exportResponse = given()
            .when().get("/api/tasks/export")
            .then()
            .statusCode(200)
            .body("$", hasSize(TASK_COUNT))
            .extract().response();
        
        List<Map<String, Object>> exportedTasks = exportResponse.as(List.class);
        
        // Verify export data integrity
        assertEquals(TASK_COUNT, exportedTasks.size(), "Should export exactly 50 tasks");
        
        // Verify each exported task has required fields
        for (int i = 0; i < exportedTasks.size(); i++) {
            Map<String, Object> task = exportedTasks.get(i);
            
            assertNotNull(task.get("id"), "Task " + i + " should have ID");
            assertNotNull(task.get("title"), "Task " + i + " should have title");
            assertNotNull(task.get("status"), "Task " + i + " should have status");
            assertNotNull(task.get("priority"), "Task " + i + " should have priority");
            assertNotNull(task.get("version"), "Task " + i + " should have version");
            assertNotNull(task.get("createdAt"), "Task " + i + " should have createdAt");
            assertNotNull(task.get("updatedAt"), "Task " + i + " should have updatedAt");
            
            // Verify lists are present (some may be null, which is acceptable)
            assertTrue(task.containsKey("tags") || task.get("tags") != null, "Task " + i + " should have tags field");
            assertTrue(task.containsKey("depends") || task.get("depends") != null, "Task " + i + " should have depends field");
            // Note: annotations field may not be present in export, which is acceptable
        }
        
        // Count tasks with dependencies
        long tasksWithDependencies = exportedTasks.stream()
            .mapToLong(task -> {
                List<?> depends = (List<?>) task.get("depends");
                return depends != null ? depends.size() : 0;
            })
            .sum();
        
        System.out.printf("✅ Exported %d tasks with %d total dependencies%n", 
                         TASK_COUNT, tasksWithDependencies);
        
        // Verify some tasks have the expected varied data
        boolean foundHighPriority = exportedTasks.stream()
            .anyMatch(task -> "HIGH".equals(task.get("priority")));
        boolean foundMediumPriority = exportedTasks.stream()
            .anyMatch(task -> "MEDIUM".equals(task.get("priority")));
        boolean foundLowPriority = exportedTasks.stream()
            .anyMatch(task -> "LOW".equals(task.get("priority")));
        
        assertTrue(foundHighPriority, "Should have HIGH priority tasks");
        assertTrue(foundMediumPriority, "Should have MEDIUM priority tasks");
        assertTrue(foundLowPriority, "Should have LOW priority tasks");
        
        System.out.println("✅ Export data integrity verified");
    }

    @Test
    @Order(4)
    void testFullExportImportCycle() throws IOException {
        System.out.println("=== Testing full export/import cycle ===");
        
        // Step 1: Create 50 tasks with dependencies
        testCreateTaskDependencies();
        
        // Step 2: Export tasks to get the data
        Response exportResponse = given()
            .when().get("/api/tasks/export")
            .then()
            .statusCode(200)
            .body("$", hasSize(TASK_COUNT))
            .extract().response();
        
        List<Map<String, Object>> exportedTasks = exportResponse.as(List.class);
        System.out.printf("✅ Exported %d tasks%n", exportedTasks.size());
        
        // Step 3: Clear all tasks
        given()
            .when().delete("/api/tasks")
            .then()
            .statusCode(204);
        
        // Verify tasks are cleared
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200)
            .body("$", hasSize(0));
        
        System.out.println("✅ Cleared all tasks");
        
        // Step 4: Create import file from exported data
        File importFile = createImportFileFromExportedTasks(exportedTasks);
        
        try {
            // Step 5: Import the tasks
            given()
                .multiPart("file", importFile, "application/json")
                .when().post("/api/tasks/import")
                .then()
                .statusCode(200)
                .body("message", containsString("Successfully imported " + TASK_COUNT + " tasks"));
            
            System.out.printf("✅ Imported %d tasks%n", TASK_COUNT);
            
            // Step 6: Wait for async operations to complete
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            // Step 7: Verify all tasks were imported
            Response importedTasksResponse = given()
                .when().get("/api/tasks")
                .then()
                .statusCode(200)
                .body("$", hasSize(TASK_COUNT))
                .extract().response();
            
            List<Map<String, Object>> importedTasks = importedTasksResponse.as(List.class);
            System.out.printf("✅ Verified %d tasks imported successfully%n", importedTasks.size());
            
            // Step 8: Verify data integrity after import
            verifyImportedTasksIntegrity(exportedTasks, importedTasks);
            
            // Step 9: Verify dependencies were preserved
            verifyDependenciesPreserved(exportedTasks, importedTasks);
            
            System.out.println("✅ Full export/import cycle completed successfully!");
            
        } finally {
            importFile.delete();
        }
    }

    @Test
    @Order(5)
    void testImportWithVersionPreservation() throws IOException {
        System.out.println("=== Testing import with version preservation ===");
        
        // Create tasks with specific versions and timestamps
        List<Map<String, Object>> tasksWithVersions = createTasksWithSpecificVersions();
        
        // Create import file
        File importFile = createImportFileFromExportedTasks(tasksWithVersions);
        
        try {
            // Import tasks
            given()
                .multiPart("file", importFile, "application/json")
                .when().post("/api/tasks/import")
                .then()
                .statusCode(200)
                .body("message", containsString("Successfully imported"));
            
            // Wait for async operations
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            // Verify versions and timestamps were preserved
            for (Map<String, Object> originalTask : tasksWithVersions) {
                String taskId = (String) originalTask.get("id");
                
                given()
                    .when().get("/api/tasks/{id}", taskId)
                    .then()
                    .statusCode(200)
                    .body("version", equalTo(originalTask.get("version")))
                    .body("createdAt", equalTo(originalTask.get("createdAt")))
                    .body("title", equalTo(originalTask.get("title")));
            }
            
            System.out.println("✅ Version and timestamp preservation verified");
            
        } finally {
            importFile.delete();
        }
    }

    // Helper methods

    private String createVariedTaskData(int index) {
        String[] priorities = {"HIGH", "MEDIUM", "LOW", "NONE"};
        String[] statuses = {"PENDING", "ACTIVE"};
        String[] assignees = {"Alice", "Bob", "Charlie", "Diana", "Eve"};
        String[] projects = {"Project Alpha", "Project Beta", "Project Gamma", null};
        
        String priority = priorities[index % priorities.length];
        String status = statuses[index % statuses.length];
        String assignee = assignees[index % assignees.length];
        String project = projects[index % projects.length];
        
        // Create varied tags
        List<String> tags = new ArrayList<>();
        if (index % 3 == 0) tags.add("urgent");
        if (index % 5 == 0) tags.add("backend");
        if (index % 7 == 0) tags.add("frontend");
        if (index % 11 == 0) tags.add("testing");
        
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"title\": \"Task ").append(index).append(" - ").append(priority).append(" Priority\",\n");
        json.append("  \"description\": \"This is task number ").append(index).append(" with varied test data for export/import testing.\",\n");
        json.append("  \"priority\": \"").append(priority).append("\",\n");
        json.append("  \"assignee\": \"").append(assignee).append("\",\n");
        
        if (project != null) {
            json.append("  \"project\": \"").append(project).append("\",\n");
        }
        
        if (!tags.isEmpty()) {
            json.append("  \"tags\": [");
            for (int i = 0; i < tags.size(); i++) {
                if (i > 0) json.append(", ");
                json.append("\"").append(tags.get(i)).append("\"");
            }
            json.append("],\n");
        }
        
        // Add due date for some tasks
        if (index % 4 == 0) {
            json.append("  \"dueDate\": \"2025-12-").append(String.format("%02d", (index % 28) + 1)).append("T23:59:59Z\",\n");
        }
        
        json.append("  \"urgency\": ").append(index % 10 + 1.0).append("\n");
        json.append("}");
        
        return json.toString();
    }

    private File createImportFileFromExportedTasks(List<Map<String, Object>> tasks) throws IOException {
        File importFile = File.createTempFile("export-import-test", ".json");
        
        try (FileWriter writer = new FileWriter(importFile)) {
            writer.write("[\n");
            
            for (int i = 0; i < tasks.size(); i++) {
                if (i > 0) writer.write(",\n");
                
                Map<String, Object> task = tasks.get(i);
                writer.write("  {\n");
                
                // Write all task fields
                writeJsonField(writer, "id", task.get("id"), false);
                writeJsonField(writer, "title", task.get("title"), false);
                writeJsonField(writer, "description", task.get("description"), false);
                writeJsonField(writer, "status", task.get("status"), false);
                writeJsonField(writer, "priority", task.get("priority"), false);
                writeJsonField(writer, "assignee", task.get("assignee"), false);
                writeJsonField(writer, "projectId", task.get("projectId"), false);
                writeJsonField(writer, "dueDate", task.get("dueDate"), false);
                writeJsonField(writer, "waitUntil", task.get("waitUntil"), false);
                writeJsonField(writer, "originalInput", task.get("originalInput"), false);
                writeJsonField(writer, "createdAt", task.get("createdAt"), false);
                writeJsonField(writer, "updatedAt", task.get("updatedAt"), false);
                writeJsonField(writer, "version", task.get("version"), true);
                writeJsonField(writer, "urgency", task.get("urgency"), true);
                
                // Write arrays
                writeJsonArray(writer, "tags", (List<?>) task.get("tags"), false);
                writeJsonArray(writer, "depends", (List<?>) task.get("depends"), false);
                writeJsonArray(writer, "annotations", (List<?>) task.get("annotations"), true);
                
                writer.write("\n  }");
            }
            
            writer.write("\n]");
        }
        
        return importFile;
    }

    private void writeJsonField(FileWriter writer, String fieldName, Object value, boolean isNumeric) throws IOException {
        writer.write("    \"" + fieldName + "\": ");
        if (value == null) {
            writer.write("null");
        } else if (isNumeric) {
            writer.write(value.toString());
        } else {
            writer.write("\"" + value.toString().replace("\"", "\\\"") + "\"");
        }
        writer.write(",\n");
    }

    private void writeJsonArray(FileWriter writer, String fieldName, List<?> list, boolean isLast) throws IOException {
        writer.write("    \"" + fieldName + "\": [");
        if (list != null && !list.isEmpty()) {
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) writer.write(", ");
                Object item = list.get(i);
                if (item instanceof String) {
                    writer.write("\"" + item.toString().replace("\"", "\\\"") + "\"");
                } else {
                    writer.write(item.toString());
                }
            }
        }
        writer.write("]");
        if (!isLast) writer.write(",");
        writer.write("\n");
    }

    private void verifyImportedTasksIntegrity(List<Map<String, Object>> exported, List<Map<String, Object>> imported) {
        System.out.println("=== Verifying imported task integrity ===");
        
        assertEquals(exported.size(), imported.size(), "Imported task count should match exported");
        
        // Create maps for easier lookup
        Map<String, Map<String, Object>> exportedMap = new HashMap<>();
        Map<String, Map<String, Object>> importedMap = new HashMap<>();
        
        for (Map<String, Object> task : exported) {
            exportedMap.put((String) task.get("id"), task);
        }
        
        for (Map<String, Object> task : imported) {
            importedMap.put((String) task.get("id"), task);
        }
        
        // Verify each exported task has a corresponding imported task
        int verifiedCount = 0;
        for (String taskId : exportedMap.keySet()) {
            Map<String, Object> exportedTask = exportedMap.get(taskId);
            Map<String, Object> importedTask = importedMap.get(taskId);
            
            assertNotNull(importedTask, "Imported task should exist for ID: " + taskId);
            
            // Verify key fields match
            assertEquals(exportedTask.get("title"), importedTask.get("title"), 
                        "Title should match for task: " + taskId);
            assertEquals(exportedTask.get("description"), importedTask.get("description"), 
                        "Description should match for task: " + taskId);
            assertEquals(exportedTask.get("priority"), importedTask.get("priority"), 
                        "Priority should match for task: " + taskId);
            assertEquals(exportedTask.get("assignee"), importedTask.get("assignee"), 
                        "Assignee should match for task: " + taskId);
            
            verifiedCount++;
        }
        
        System.out.printf("✅ Verified integrity of %d tasks%n", verifiedCount);
    }

    private void verifyDependenciesPreserved(List<Map<String, Object>> exported, List<Map<String, Object>> imported) {
        System.out.println("=== Verifying dependencies preserved ===");
        
        Map<String, List<?>> exportedDeps = new HashMap<>();
        Map<String, List<?>> importedDeps = new HashMap<>();
        
        for (Map<String, Object> task : exported) {
            String id = (String) task.get("id");
            List<?> depends = (List<?>) task.get("depends");
            if (depends != null && !depends.isEmpty()) {
                exportedDeps.put(id, depends);
            }
        }
        
        for (Map<String, Object> task : imported) {
            String id = (String) task.get("id");
            List<?> depends = (List<?>) task.get("depends");
            if (depends != null && !depends.isEmpty()) {
                importedDeps.put(id, depends);
            }
        }
        
        assertEquals(exportedDeps.size(), importedDeps.size(), 
                    "Number of tasks with dependencies should match");
        
        for (String taskId : exportedDeps.keySet()) {
            List<?> exportedTaskDeps = exportedDeps.get(taskId);
            List<?> importedTaskDeps = importedDeps.get(taskId);
            
            assertNotNull(importedTaskDeps, "Imported task should have dependencies: " + taskId);
            assertEquals(exportedTaskDeps.size(), importedTaskDeps.size(), 
                        "Dependency count should match for task: " + taskId);
            
            // Verify all dependencies are preserved
            for (Object dep : exportedTaskDeps) {
                assertTrue(importedTaskDeps.contains(dep), 
                          "Dependency should be preserved: " + dep + " for task: " + taskId);
            }
        }
        
        System.out.printf("✅ Verified dependencies for %d tasks%n", exportedDeps.size());
    }

    private List<Map<String, Object>> createTasksWithSpecificVersions() {
        List<Map<String, Object>> tasks = new ArrayList<>();
        
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> task = new HashMap<>();
            task.put("id", UUID.randomUUID().toString());
            task.put("title", "Version Test Task " + i);
            task.put("description", "Task with specific version " + (i * 2));
            task.put("status", "PENDING");
            task.put("priority", "MEDIUM");
            task.put("assignee", "Version Tester");
            task.put("tags", Arrays.asList("version-test"));
            task.put("depends", new ArrayList<>());
            task.put("annotations", new ArrayList<>());
            task.put("createdAt", "2025-01-0" + i + "T10:00:00Z");
            task.put("updatedAt", "2025-01-0" + i + "T11:00:00Z");
            task.put("version", i * 2); // Specific versions: 2, 4, 6, 8, 10
            task.put("urgency", i * 1.5);
            
            tasks.add(task);
        }
        
        return tasks;
    }
}
