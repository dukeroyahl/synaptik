package org.dukeroyahl.synaptik.helper;

import org.dukeroyahl.synaptik.domain.TaskStatus;
import org.bson.Document;
import org.jboss.logging.Logger;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Helper class for building MongoDB search queries for task filtering.
 * Separates query building logic from the main service for better organization and testability.
 */
@ApplicationScoped
public class TaskSearchQueryBuilder {
    
    private static final Logger logger = Logger.getLogger(TaskSearchQueryBuilder.class);
    
    /**
     * Build MongoDB query document based on search filters.
     * 
     * @param statuses List of task statuses to filter by (optional)
     * @param title Partial title search (optional, case-insensitive)
     * @param assignee Partial assignee search (optional, case-insensitive)
     * @param projectId Project UUID for exact matching (optional)
     * @param dateFrom Start date for due date range filter (optional, ISO format)
     * @param dateTo End date for due date range filter (optional, ISO format)
     * @param timezone Timezone for date range filtering (default: UTC)
     * @return MongoDB query document
     */
    public Document buildSearchQuery(List<TaskStatus> statuses, String title, String assignee, 
                                   String projectId, String dateFrom, String dateTo, String timezone) {
        Document query = new Document();
        
        // Add status filter
        addStatusFilter(query, statuses);
        
        // Add title filter
        addTitleFilter(query, title);
        
        // Add assignee filter
        addAssigneeFilter(query, assignee);
        
        // Add project filter
        addProjectFilter(query, projectId);
        
        // Add date range filter
        addDateRangeFilter(query, dateFrom, dateTo, timezone);
        
        logger.debugf("Built MongoDB query: %s", query.toJson());
        return query;
    }
    
    /**
     * Add status filter to the query.
     * Uses $in operator for multiple statuses for optimal performance.
     */
    private void addStatusFilter(Document query, List<TaskStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return; // No filter to add
        }
        
        if (statuses.size() == 1) {
            // Single status - direct equality
            query.append("status", statuses.get(0).name());
        } else {
            // Multiple statuses - use $in operator
            List<String> statusStrings = statuses.stream()
                .map(TaskStatus::name)
                .collect(Collectors.toList());
            query.append("status", new Document("$in", statusStrings));
        }
        
        logger.debugf("Added status filter: %s", statuses);
    }
    
    /**
     * Add title filter to the query.
     * Uses case-insensitive regex with Pattern.quote for safety.
     */
    private void addTitleFilter(Document query, String title) {
        if (title == null || title.trim().isEmpty()) {
            return; // No filter to add
        }
        
        String normalizedTitle = title.trim();
        query.append("title", new Document("$regex", Pattern.quote(normalizedTitle))
            .append("$options", "i")); // case-insensitive
        
        logger.debugf("Added title filter: %s", normalizedTitle);
    }
    
    /**
     * Add assignee filter to the query.
     * Uses case-insensitive regex with Pattern.quote for safety.
     */
    private void addAssigneeFilter(Document query, String assignee) {
        if (assignee == null || assignee.trim().isEmpty()) {
            return; // No filter to add
        }
        
        String normalizedAssignee = assignee.trim();
        query.append("assignee", new Document("$regex", Pattern.quote(normalizedAssignee))
            .append("$options", "i")); // case-insensitive
        
        logger.debugf("Added assignee filter: %s", normalizedAssignee);
    }
    
    /**
     * Add project filter to the query.
     * Only accepts valid UUIDs for exact matching.
     */
    private void addProjectFilter(Document query, String projectId) {
        if (projectId == null || projectId.trim().isEmpty()) {
            return; // No filter to add
        }
        
        String trimmedProjectId = projectId.trim();
        
        if (isValidUUID(trimmedProjectId)) {
            try {
                UUID projectUUID = UUID.fromString(trimmedProjectId);
                query.append("projectId", projectUUID);
                logger.debugf("Added project filter: %s", projectUUID);
            } catch (IllegalArgumentException e) {
                logger.warnf("Invalid project UUID format: %s", trimmedProjectId);
                // Invalid UUID format, force no results
                query.append("_id", new Document("$exists", false));
            }
        } else {
            logger.warnf("Project ID is not a valid UUID format: %s", trimmedProjectId);
            // Not a UUID, force no results
            query.append("_id", new Document("$exists", false));
        }
    }
    
    /**
     * Add date range filter to the query.
     * Handles timezone-aware date filtering with proper start/end of day boundaries.
     */
    private void addDateRangeFilter(Document query, String dateFrom, String dateTo, String timezone) {
        if ((dateFrom == null || dateFrom.trim().isEmpty()) && 
            (dateTo == null || dateTo.trim().isEmpty())) {
            return; // No date filter to add
        }
        
        ZoneId zone = resolveZone(timezone);
        Document dateQuery = buildDateRangeQuery(dateFrom, dateTo, zone);
        
        if (dateQuery != null && !dateQuery.isEmpty()) {
            query.append("dueDate", dateQuery);
            logger.debugf("Added date range filter: %s to %s in timezone %s", dateFrom, dateTo, timezone);
        }
    }
    
    /**
     * Build MongoDB date range query document.
     */
    private Document buildDateRangeQuery(String dateFrom, String dateTo, ZoneId zone) {
        Document dateQuery = new Document();
        
        // Handle dateFrom (start of day in user's timezone)
        if (dateFrom != null && !dateFrom.trim().isEmpty()) {
            ZonedDateTime fromDate = parseDateForRange(dateFrom.trim(), zone, true);
            if (fromDate != null) {
                dateQuery.append("$gte", fromDate.toInstant().toString());
            }
        }
        
        // Handle dateTo (end of day in user's timezone)
        if (dateTo != null && !dateTo.trim().isEmpty()) {
            ZonedDateTime toDate = parseDateForRange(dateTo.trim(), zone, false);
            if (toDate != null) {
                dateQuery.append("$lte", toDate.toInstant().toString());
            }
        }
        
        return dateQuery;
    }
    
    /**
     * Parse date for range filtering with proper timezone handling.
     * 
     * @param dateStr Date string to parse
     * @param zone Target timezone
     * @param startOfDay If true, returns start of day (00:00:00), otherwise end of day (23:59:59.999)
     * @return ZonedDateTime or null if parsing fails
     */
    private ZonedDateTime parseDateForRange(String dateStr, ZoneId zone, boolean startOfDay) {
        try {
            // Try ZonedDateTime first (already has timezone info)
            ZonedDateTime zdt = ZonedDateTime.parse(dateStr);
            return startOfDay ? zdt.withHour(0).withMinute(0).withSecond(0).withNano(0) 
                             : zdt.withHour(23).withMinute(59).withSecond(59).withNano(999_000_000);
        } catch (Exception ignored) {}
        
        try {
            // Try LocalDateTime (apply user's timezone)
            LocalDateTime ldt = LocalDateTime.parse(dateStr);
            ZonedDateTime zdt = ldt.atZone(zone);
            return startOfDay ? zdt.withHour(0).withMinute(0).withSecond(0).withNano(0)
                             : zdt.withHour(23).withMinute(59).withSecond(59).withNano(999_000_000);
        } catch (Exception ignored) {}
        
        try {
            // Try LocalDate (apply user's timezone)
            LocalDate ld = LocalDate.parse(dateStr);
            if (startOfDay) {
                return ld.atStartOfDay(zone);
            } else {
                return ld.atTime(23, 59, 59, 999_000_000).atZone(zone);
            }
        } catch (Exception ignored) {}
        
        logger.warnf("Unable to parse date: %s", dateStr);
        return null;
    }
    
    /**
     * Resolve timezone string to ZoneId with fallback to UTC.
     */
    private ZoneId resolveZone(String timezone) {
        if (timezone == null || timezone.trim().isEmpty()) {
            return ZoneId.of("UTC");
        }
        
        try {
            return ZoneId.of(timezone.trim());
        } catch (Exception e) {
            logger.warnf("Invalid timezone: %s, falling back to UTC", timezone);
            return ZoneId.of("UTC");
        }
    }
    
    /**
     * Check if a string is a valid UUID format.
     * Uses regex pattern matching for performance.
     */
    private boolean isValidUUID(String str) {
        if (str == null || str.length() != 36) {
            return false;
        }
        
        // Basic UUID format check: 8-4-4-4-12 characters with hyphens
        return str.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    }
}
