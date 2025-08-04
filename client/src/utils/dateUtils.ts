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
 * Get time remaining until a backend date
 */
export function getTimeRemainingFromBackendDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    const date = parseBackendDate(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // If overdue
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (overdueDays === 1) return '1 day overdue';
      if (overdueDays < 7) return `${overdueDays} days overdue`;
      if (overdueDays < 14) return `${Math.ceil(overdueDays / 7)} week${Math.ceil(overdueDays / 7) !== 1 ? 's' : ''} overdue`;
      if (overdueDays < 60) return `${Math.ceil(overdueDays / 7)} weeks overdue`;
      return `${Math.ceil(overdueDays / 30)} months overdue`;
    }
    
    // If due today or in future
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 14) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) !== 1 ? 's' : ''} left`;
    if (diffDays < 60) return `${Math.ceil(diffDays / 7)} weeks left`;
    return `${Math.ceil(diffDays / 30)} months left`;
  } catch {
    return null;
  }
}

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
