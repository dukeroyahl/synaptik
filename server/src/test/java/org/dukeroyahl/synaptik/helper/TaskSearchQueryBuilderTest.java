package org.dukeroyahl.synaptik.helper;

import io.quarkus.test.junit.QuarkusTest;
import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import jakarta.inject.Inject;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class TaskSearchQueryBuilderTest {

    @Inject
    TaskSearchQueryBuilder queryBuilder;

    @Test
    public void testEmptyQuery() {
        Document query = queryBuilder.buildSearchQuery(null, null, null, null, null, null, "UTC");
        assertTrue(query.isEmpty(), "Empty filters should produce empty query");
    }

    @Test
    public void testSingleStatusFilter() {
        List<TaskStatus> statuses = Arrays.asList(TaskStatus.PENDING);
        Document query = queryBuilder.buildSearchQuery(statuses, null, null, null, null, null, "UTC");
        
        assertEquals("PENDING", query.getString("status"));
    }

    @Test
    public void testMultipleStatusFilter() {
        List<TaskStatus> statuses = Arrays.asList(TaskStatus.PENDING, TaskStatus.ACTIVE);
        Document query = queryBuilder.buildSearchQuery(statuses, null, null, null, null, null, "UTC");
        
        Document statusQuery = (Document) query.get("status");
        assertNotNull(statusQuery);
        assertTrue(statusQuery.containsKey("$in"));
        
        @SuppressWarnings("unchecked")
        List<String> statusValues = (List<String>) statusQuery.get("$in");
        assertEquals(2, statusValues.size());
        assertTrue(statusValues.contains("PENDING"));
        assertTrue(statusValues.contains("ACTIVE"));
    }

    @Test
    public void testTitleFilter() {
        Document query = queryBuilder.buildSearchQuery(null, "test title", null, null, null, null, "UTC");
        
        Document titleQuery = (Document) query.get("title");
        assertNotNull(titleQuery);
        assertEquals("test title", titleQuery.getString("$regex"));
        assertEquals("i", titleQuery.getString("$options"));
    }

    @Test
    public void testAssigneeFilter() {
        Document query = queryBuilder.buildSearchQuery(null, null, "john doe", null, null, null, "UTC");
        
        Document assigneeQuery = (Document) query.get("assignee");
        assertNotNull(assigneeQuery);
        assertEquals("john doe", assigneeQuery.getString("$regex"));
        assertEquals("i", assigneeQuery.getString("$options"));
    }

    @Test
    public void testValidProjectIdFilter() {
        String projectId = UUID.randomUUID().toString();
        Document query = queryBuilder.buildSearchQuery(null, null, null, projectId, null, null, "UTC");
        
        assertEquals(projectId, query.get("projectId").toString());
    }

    @Test
    public void testInvalidProjectIdFilter() {
        Document query = queryBuilder.buildSearchQuery(null, null, null, "invalid-uuid", null, null, "UTC");
        
        // Should force no results for invalid UUID
        Document idQuery = (Document) query.get("_id");
        assertNotNull(idQuery);
        assertFalse((Boolean) idQuery.get("$exists"));
    }

    @Test
    public void testDateRangeFilter() {
        Document query = queryBuilder.buildSearchQuery(null, null, null, null, "2025-08-15", "2025-08-20", "UTC");
        
        Document dateQuery = (Document) query.get("dueDate");
        assertNotNull(dateQuery);
        assertTrue(dateQuery.containsKey("$gte"));
        assertTrue(dateQuery.containsKey("$lte"));
        
        String fromDate = dateQuery.getString("$gte");
        String toDate = dateQuery.getString("$lte");
        
        assertTrue(fromDate.startsWith("2025-08-15"));
        assertTrue(toDate.startsWith("2025-08-20"));
    }

    @Test
    public void testComplexQuery() {
        List<TaskStatus> statuses = Arrays.asList(TaskStatus.PENDING, TaskStatus.ACTIVE);
        String projectId = UUID.randomUUID().toString();
        
        Document query = queryBuilder.buildSearchQuery(
            statuses, "test", "john", projectId, "2025-08-15", "2025-08-20", "UTC"
        );
        
        // Should have all filters
        assertTrue(query.containsKey("status"));
        assertTrue(query.containsKey("title"));
        assertTrue(query.containsKey("assignee"));
        assertTrue(query.containsKey("projectId"));
        assertTrue(query.containsKey("dueDate"));
        
        assertEquals(5, query.size());
    }

    @Test
    public void testTimezoneHandling() {
        Document queryUTC = queryBuilder.buildSearchQuery(null, null, null, null, "2025-08-15", null, "UTC");
        Document queryEST = queryBuilder.buildSearchQuery(null, null, null, null, "2025-08-15", null, "America/New_York");
        
        Document dateQueryUTC = (Document) queryUTC.get("dueDate");
        Document dateQueryEST = (Document) queryEST.get("dueDate");
        
        assertNotNull(dateQueryUTC);
        assertNotNull(dateQueryEST);
        
        // The actual date strings should be different due to timezone conversion
        String utcDate = dateQueryUTC.getString("$gte");
        String estDate = dateQueryEST.getString("$gte");
        
        assertNotEquals(utcDate, estDate);
    }

    @Test
    public void testWhitespaceHandling() {
        Document query = queryBuilder.buildSearchQuery(null, "  test title  ", "  john doe  ", null, null, null, "UTC");
        
        Document titleQuery = (Document) query.get("title");
        Document assigneeQuery = (Document) query.get("assignee");
        
        assertEquals("test title", titleQuery.getString("$regex"));
        assertEquals("john doe", assigneeQuery.getString("$regex"));
    }

    @Test
    public void testEmptyStringHandling() {
        Document query = queryBuilder.buildSearchQuery(null, "", "", "", "", "", "");
        
        // Empty strings should be treated as no filter
        assertTrue(query.isEmpty());
    }
}
