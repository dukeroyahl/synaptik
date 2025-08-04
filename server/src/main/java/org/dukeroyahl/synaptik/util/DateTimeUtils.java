package org.dukeroyahl.synaptik.util;

import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Utility class for timezone-aware date/time handling.
 * Server creates dates in user's timezone and returns them with timezone info.
 * Browser handles conversion to user's display locale automatically.
 */
public class DateTimeUtils {
    
    public static final String DEFAULT_TIMEZONE = "America/New_York"; // Fallback timezone
    
    /**
     * Get current time in user's timezone
     */
    public static ZonedDateTime nowInUserTimezone(String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone);
    }
    
    /**
     * Get "tomorrow" end of day in user's timezone
     */
    public static ZonedDateTime tomorrowInUserTimezone(String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone)
                .plusDays(1)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Get "today" end of day in user's timezone
     */
    public static ZonedDateTime todayEndInUserTimezone(String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Get yesterday end of day in user's timezone
     */
    public static ZonedDateTime yesterdayInUserTimezone(String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone)
                .minusDays(1)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Get next occurrence of a weekday in user's timezone
     * @param targetDayOfWeek 1=Monday, 7=Sunday
     */
    public static ZonedDateTime nextWeekdayInUserTimezone(int targetDayOfWeek, String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        ZonedDateTime now = ZonedDateTime.now(userZone);
        
        int currentDayOfWeek = now.getDayOfWeek().getValue();
        int daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        if (daysToAdd == 0) daysToAdd = 7; // Next week if it's the same day
        
        return now.plusDays(daysToAdd)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Add weeks to current time in user's timezone
     */
    public static ZonedDateTime addWeeksInUserTimezone(int weeks, String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone)
                .plusWeeks(weeks)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Add days to current time in user's timezone
     */
    public static ZonedDateTime addDaysInUserTimezone(int days, String userTimezone) {
        ZoneId userZone = parseTimezone(userTimezone);
        return ZonedDateTime.now(userZone)
                .plusDays(days)
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);
    }
    
    /**
     * Check if a date is in the past (comparing in the date's own timezone)
     */
    public static boolean isInPast(ZonedDateTime dateTime) {
        if (dateTime == null) return false;
        ZonedDateTime now = ZonedDateTime.now(dateTime.getZone());
        return dateTime.isBefore(now);
    }
    
    /**
     * Parse timezone string safely with fallback
     */
    private static ZoneId parseTimezone(String userTimezone) {
        if (userTimezone == null || userTimezone.trim().isEmpty()) {
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
        
        try {
            return ZoneId.of(userTimezone);
        } catch (Exception e) {
            // Log warning and use default
            System.err.println("Invalid timezone: " + userTimezone + ", using default: " + DEFAULT_TIMEZONE);
            return ZoneId.of(DEFAULT_TIMEZONE);
        }
    }
    
    /**
     * Get user's timezone from request headers or default
     */
    public static String getUserTimezoneFromHeaders(jakarta.ws.rs.core.HttpHeaders headers) {
        if (headers == null) return DEFAULT_TIMEZONE;
        
        // Check for custom timezone header
        String timezone = headers.getHeaderString("X-User-Timezone");
        if (timezone != null && !timezone.trim().isEmpty()) {
            return timezone.trim();
        }
        
        // Could also parse from Accept-Language or other headers
        return DEFAULT_TIMEZONE;
    }
    
    /**
     * Parse a date/time string with timezone context
     */
    public static ZonedDateTime parseWithTimezone(String dateTimeStr, String userTimezone) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }
        
        try {
            // If it already has timezone info, use it
            if (dateTimeStr.contains("+") || dateTimeStr.contains("Z") || dateTimeStr.matches(".*[+-]\\d{2}:\\d{2}$")) {
                return ZonedDateTime.parse(dateTimeStr);
            }
            
            // Otherwise, assume it's in the user's timezone
            ZoneId userZone = parseTimezone(userTimezone);
            return ZonedDateTime.parse(dateTimeStr + "[" + userZone.getId() + "]");
        } catch (Exception e) {
            System.err.println("Failed to parse date: " + dateTimeStr + " with timezone: " + userTimezone);
            return null;
        }
    }
}
