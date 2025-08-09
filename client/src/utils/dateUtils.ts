/**
 * Simple timezone-aware date utilities
 * Server returns ISO string with timezone info, browser handles locale conversion
 */

/**
 * Get user's timezone (browser's timezone)
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Parse a date string from the backend
 * Backend format: "2025-08-10T23:59:22.443-05:00" (ISO string with timezone)
 */
export function parseBackendDate(dateStr: string): Date {
  if (!dateStr) throw new Error('Date string is required');
  
  // Backend now sends ISO string with timezone info
  // Browser's Date constructor handles timezone conversion automatically
  return new Date(dateStr);
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
 * Format backend date for display using browser's locale
 */
export function formatBackendDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = parseBackendDate(dateStr);
    const now = new Date();
    
    // Calculate difference in days
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // Use browser's native date formatting in user's locale
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      weekday: 'short'
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Unified date formatting function that handles both time remaining and date display
 */
export function formatDateFromBackend(dateStr: string, format: 'timeRemaining' | 'fullDate' = 'timeRemaining'): string | null {
  if (!dateStr) return null;
  
  try {
    const dueDate = parseBackendDate(dateStr);
    
    // Check for invalid date
    if (isNaN(dueDate.getTime()) || dueDate.getFullYear() < 2000 || dueDate.getFullYear() > 2100) {
      return null;
    }
    
    const now = new Date();
    
    // Use proper date comparison - start of today vs start of due date
    // Important: Use local timezone for date comparison to avoid timezone issues
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
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
      // Return formatted date display
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
      if (diffDays < 7) return `${diffDays}d`;
      
      // Format as YYYY-Mon-DD (DayOfWeek)
      const year = dueDate.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const month = monthNames[dueDate.getMonth()];
      const day = String(dueDate.getDate()).padStart(2, '0');
      const dayOfWeek = dayNames[dueDate.getDay()];
      
      return `${year}-${month}-${day} (${dayOfWeek})`;
    }
  } catch {
    return null;
  }
}

/**
 * Get time remaining until a backend date
 * Standardized function for all time remaining calculations
 */
export function getTimeRemainingFromBackendDate(dateStr: string): string | null {
  return formatDateFromBackend(dateStr, 'timeRemaining');
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
 * Format a date for backend submission (browser handles timezone)
 */
export function formatForBackend(date: Date): string {
  // Send as ISO string with timezone info
  return date.toISOString();
}
