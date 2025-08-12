package org.dukeroyahl.synaptik.util;

import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Utility class for consistent ISO 8601 date/time handling with timezone support.
 * All dates are stored and transmitted as ISO 8601 strings with timezone information.
 * 
 * Supported formats:
 * - "2025-08-11T14:30:00Z" (UTC)
 * - "2025-08-11T10:30:00-04:00" (with offset)
 * - "2025-08-11T14:30:00+02:00" (with offset)
 */
public class DateTimeHelper {
    
    public static final String DEFAULT_TIMEZONE = "UTC";
    
    /**
     * Get current time as ISO 8601 string in UTC.
     * @return ISO 8601 string like "2025-08-11T14:30:00Z"
     */
    public static String nowUtc() {
        return ZonedDateTime.now(ZoneId.of("UTC")).format(DateTimeFormatter.ISO_INSTANT);
    }
    
    /**
     * Get current time as ISO 8601 string in specified timezone.
     * @param timezone Timezone ID (e.g., "America/New_York", "UTC")
     * @return ISO 8601 string with timezone offset
     */
    public static String nowInTimezone(String timezone) {
        ZoneId zone = parseTimezone(timezone);
        return ZonedDateTime.now(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
    
    /**
     * Parse an ISO 8601 date string to ZonedDateTime.
     * Handles various ISO 8601 formats with and without timezone.
     * 
     * @param dateString ISO 8601 date string
     * @return ZonedDateTime or null if parsing fails
     */
    public static ZonedDateTime parseIso8601(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        String normalized = dateString.trim();
        
        try {
            // Try parsing as ZonedDateTime first (with timezone info)
            return ZonedDateTime.parse(normalized);
        } catch (DateTimeParseException e1) {
            try {
                // Try parsing as LocalDateTime and assume UTC
                LocalDateTime localDateTime = LocalDateTime.parse(normalized);
                return localDateTime.atZone(ZoneId.of("UTC"));
            } catch (DateTimeParseException e2) {
                // Try parsing date-only format and assume end of day UTC
                if (normalized.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    LocalDateTime localDateTime = LocalDateTime.parse(normalized + "T23:59:59");
                    return localDateTime.atZone(ZoneId.of("UTC"));
                }
                return null;
            }
        }
    }
    
    /**
     * Convert a date string to ISO 8601 format with timezone.
     * If the input doesn't have timezone info, applies the specified timezone.
     * 
     * @param dateString Input date string
     * @param fallbackTimezone Timezone to use if input has no timezone info
     * @return ISO 8601 string with timezone
     */
    public static String normalizeToIso8601(String dateString, String fallbackTimezone) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        ZonedDateTime zonedDateTime = parseIso8601(dateString);
        if (zonedDateTime != null) {
            return zonedDateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }
        
        // If parsing failed, try with fallback timezone
        try {
            String normalized = dateString.trim();
            
            // Handle date-only format
            if (normalized.matches("\\d{4}-\\d{2}-\\d{2}")) {
                normalized += "T23:59:59";
            }
            
            LocalDateTime localDateTime = LocalDateTime.parse(normalized);
            ZoneId zone = parseTimezone(fallbackTimezone);
            return localDateTime.atZone(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Check if a date is before another date, handling timezone conversions.
     * 
     * @param dateString1 First date as ISO 8601 string
     * @param dateString2 Second date as ISO 8601 string
     * @return true if dateString1 is before dateString2
     */
    public static boolean isBefore(String dateString1, String dateString2) {
        ZonedDateTime date1 = parseIso8601(dateString1);
        ZonedDateTime date2 = parseIso8601(dateString2);
        
        if (date1 == null || date2 == null) {
            return false;
        }
        
        return date1.isBefore(date2);
    }
    
    /**
     * Check if a date falls within a date range in a specific timezone.
     * 
     * @param dateString Date to check as ISO 8601 string
     * @param startOfDay Start of day in target timezone
     * @param endOfDay End of day in target timezone
     * @return true if date falls within the range
     */
    public static boolean isWithinRange(String dateString, ZonedDateTime startOfDay, ZonedDateTime endOfDay) {
        ZonedDateTime date = parseIso8601(dateString);
        if (date == null) {
            return false;
        }
        
        // Convert to same timezone for comparison
        ZonedDateTime dateInTargetZone = date.withZoneSameInstant(startOfDay.getZone());
        
        return !dateInTargetZone.isBefore(startOfDay) && !dateInTargetZone.isAfter(endOfDay);
    }
    
    /**
     * Get start of day in specified timezone.
     * 
     * @param timezone Timezone ID
     * @return ZonedDateTime representing start of today in the timezone
     */
    public static ZonedDateTime startOfDayInTimezone(String timezone) {
        ZoneId zone = parseTimezone(timezone);
        return ZonedDateTime.now(zone)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
    }
    
    /**
     * Get end of day in specified timezone.
     * 
     * @param timezone Timezone ID
     * @return ZonedDateTime representing end of today in the timezone
     */
    public static ZonedDateTime endOfDayInTimezone(String timezone) {
        ZoneId zone = parseTimezone(timezone);
        return ZonedDateTime.now(zone)
                .withHour(23).withMinute(59).withSecond(59).withNano(999_000_000);
    }
    
    /**
     * Parse timezone string to ZoneId with fallback to UTC.
     * 
     * @param timezone Timezone string
     * @return ZoneId (never null)
     */
    public static ZoneId parseTimezone(String timezone) {
        if (timezone == null || timezone.trim().isEmpty()) {
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
        
        try {
            return ZoneId.of(timezone.trim());
        } catch (Exception e) {
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
    }
}
