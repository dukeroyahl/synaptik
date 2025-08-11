/**
 * Enhanced timezone-aware date utilities with full ISO 8601 support
 * Supports both date-only and datetime with timezone formats
 */

import { format, parseISO, isValid, formatISO, startOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Get user's timezone (browser's timezone)
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Parse a date string from the backend with full ISO 8601 support
 * Supports formats:
 * - "2025-08-10T23:59:22.443-05:00" (ISO string with timezone)
 * - "2025-08-10T23:59:22Z" (ISO string UTC)
 * - "2025-08-08" (date-only string)
 */
export function parseBackendDate(dateStr: string): Date {
  if (!dateStr) throw new Error('Date string is required');
  
  // Handle date-only strings (YYYY-MM-DD) to avoid timezone issues
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Parse as local date to avoid UTC conversion
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  
  // Use date-fns parseISO for robust ISO 8601 parsing
  try {
    const parsedDate = parseISO(dateStr);
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid date parsed from: ${dateStr}`);
    }
    return parsedDate;
  } catch (error) {
    // Log the problematic date string for debugging
    console.error('Failed to parse date string:', dateStr, error);
    throw new Error(`Failed to parse date string: ${dateStr}`);
  }
}

/**
 * Format a date for backend submission in ISO 8601 format with timezone
 * @param date - Date object to format
 * @param includeTime - Whether to include time (default: true)
 * @param timezone - Timezone to use (default: user's timezone)
 */
export function formatForBackend(date: Date, includeTime: boolean = true, timezone?: string): string {
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  
  const tz = timezone || getUserTimezone();
  
  if (includeTime) {
    // Return full ISO 8601 string with timezone
    return formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  } else {
    // Return date-only string
    return format(date, 'yyyy-MM-dd');
  }
}

/**
 * Convert a date input value (YYYY-MM-DD) to ISO 8601 with timezone
 * Used when converting HTML date input values to backend format
 */
export function dateInputToISO(dateInputValue: string, timezone?: string): string {
  if (!dateInputValue) return '';
  
  const tz = timezone || getUserTimezone();
  
  // Parse the date input as local date
  const [year, month, day] = dateInputValue.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  // Convert to start of day in the specified timezone
  const zonedDate = fromZonedTime(startOfDay(localDate), tz);
  
  return formatISO(zonedDate);
}

/**
 * Convert ISO 8601 date to HTML date input format (YYYY-MM-DD)
 * Used when populating HTML date input fields
 */
export function isoToDateInput(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = parseBackendDate(isoString);
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Convert ISO 8601 datetime to HTML datetime-local input format
 * Format: YYYY-MM-DDTHH:mm
 */
export function isoToDateTimeInput(isoString: string, timezone?: string): string {
  if (!isoString) return '';
  
  try {
    const date = parseBackendDate(isoString);
    const tz = timezone || getUserTimezone();
    
    // Convert to user's timezone for display
    const zonedDate = toZonedTime(date, tz);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

/**
 * Convert HTML datetime-local input to ISO 8601 with timezone
 * Input format: YYYY-MM-DDTHH:mm
 */
export function dateTimeInputToISO(dateTimeInputValue: string, timezone?: string): string {
  if (!dateTimeInputValue) return '';
  
  const tz = timezone || getUserTimezone();
  
  try {
    // Parse the datetime-local input
    const localDate = new Date(dateTimeInputValue);
    
    // Convert to UTC considering the timezone
    const utcDate = fromZonedTime(localDate, tz);
    
    return formatISO(utcDate);
  } catch {
    return '';
  }
}

/**
 * Check if a backend date string represents a past date
 */
export function isBackendDateInPast(dateStr: string): boolean {
  if (!dateStr) return false;
  
  try {
    const date = parseBackendDate(dateStr);
    return date < new Date();
  } catch {
    return false;
  }
}

/**
 * Format backend date for display using browser's locale with timezone awareness
 */
export function formatBackendDateForDisplay(dateStr: string, timezone?: string): string {
  if (!dateStr) return '';
  
  try {
    const date = parseBackendDate(dateStr);
    const tz = timezone || getUserTimezone();
    const now = new Date();
    
    // Calculate difference in days using timezone-aware comparison
    const dateInTz = toZonedTime(date, tz);
    const nowInTz = toZonedTime(now, tz);
    
    const diffMs = startOfDay(dateInTz).getTime() - startOfDay(nowInTz).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // Use timezone-aware formatting
    return formatInTimeZone(date, tz, 'yyyy-MMM-dd (EEE)');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Unified date formatting function that handles both time remaining and date display
 */
export function formatDateFromBackend(dateStr: string, format: 'timeRemaining' | 'fullDate' = 'timeRemaining', timezone?: string): string | null {
  if (!dateStr) return null;
  
  try {
    const dueDate = parseBackendDate(dateStr);
    const tz = timezone || getUserTimezone();
    
    // Check for invalid date
    if (!isValid(dueDate) || dueDate.getFullYear() < 2000 || dueDate.getFullYear() > 2100) {
      return null;
    }
    
    const now = new Date();
    
    // Use timezone-aware date comparison
    const dueDateInTz = toZonedTime(dueDate, tz);
    const nowInTz = toZonedTime(now, tz);
    
    const startOfToday = startOfDay(nowInTz);
    const startOfDueDate = startOfDay(dueDateInTz);
    
    const diffMs = startOfDueDate.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (format === 'timeRemaining') {
      // Return time remaining format
      if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        if (overdueDays === 1) return '1 day overdue';
        if (overdueDays < 14) return `${overdueDays} days overdue`;
        if (overdueDays < 60) return `${Math.ceil(overdueDays / 7)} weeks overdue`;
        return `${Math.ceil(overdueDays / 30)} months overdue`;
      }
      
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return '1 day left';
      if (diffDays < 14) return `${diffDays} days left`;
      if (diffDays < 60) return `${Math.ceil(diffDays / 7)} weeks left`;
      return `${Math.ceil(diffDays / 30)} months left`;
    } else {
      // Return formatted date display with timezone
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
      if (diffDays < 7) return `${diffDays}d`;
      
      return formatInTimeZone(dueDate, tz, 'yyyy-MMM-dd (EEE)');
    }
  } catch {
    return null;
  }
}

/**
 * Get time remaining until a backend date
 * Standardized function for all time remaining calculations
 */
export function getTimeRemainingFromBackendDate(dateStr: string, timezone?: string): string | null {
  return formatDateFromBackend(dateStr, 'timeRemaining', timezone);
}

/**
 * Alias for backward compatibility and simpler naming
 */
export const getTimeRemaining = getTimeRemainingFromBackendDate;

/**
 * Send user's timezone to backend in API calls
 */
export function getTimezoneHeaders(): Record<string, string> {
  return {
    'X-User-Timezone': getUserTimezone()
  };
}

/**
 * Format a date for display with full timezone information
 * Shows both local time and timezone abbreviation
 */
export function formatDateWithTimezone(dateStr: string, timezone?: string): string {
  if (!dateStr) return '';
  
  try {
    const date = parseBackendDate(dateStr);
    const tz = timezone || getUserTimezone();
    
    return formatInTimeZone(date, tz, 'yyyy-MM-dd HH:mm:ss zzz');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get current date in ISO 8601 format with timezone
 */
export function getCurrentDateISO(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Get current date in date-only format (YYYY-MM-DD)
 */
export function getCurrentDateOnly(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
}

/**
 * Validate if a string is a valid ISO 8601 date
 */
export function isValidISODate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  try {
    const date = parseISO(dateStr);
    return isValid(date);
  } catch {
    return false;
  }
}

/**
 * Convert any date format to ISO 8601 with timezone
 * Useful for normalizing date inputs from various sources
 */
export function normalizeToISO(dateInput: string | Date, timezone?: string): string {
  if (!dateInput) return '';
  
  const tz = timezone || getUserTimezone();
  
  try {
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Try to parse various formats
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Date-only format
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = parseISO(dateInput);
      }
    } else {
      throw new Error('Invalid date input type');
    }
    
    if (!isValid(date)) {
      throw new Error('Invalid date');
    }
    
    return formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  } catch {
    return '';
  }
}
