import { Task } from '../types';
import { getQuadrant } from './eisenhowerUtils';

/**
 * Generate a short, readable task ID from MongoDB ObjectId or externalId
 * Format: SYN-XXXX (e.g., SYN-1A2B)
 */
export function generateTaskId(task: Task): string {
  if (!task || !task.id) return 'SYN-0000';
  
  // Use last 4 chars of MongoDB ObjectId
  return `SYN-${task.id.slice(-4).toUpperCase()}`;
}

/**
 * Get CSS class for task card based on priority, status, and Eisenhower quadrant
 */
export function getTaskCardClass(task: Task): string {
  const quadrant = getQuadrant(task);
  const classes = [];
  
  // Add quadrant class
  switch (quadrant) {
    case 0: classes.push('quadrant-urgent-important'); break;
    case 1: classes.push('quadrant-important-not-urgent'); break;
    case 2: classes.push('quadrant-urgent-not-important'); break;
    case 3: classes.push('quadrant-not-urgent-not-important'); break;
  }
  
  // Add priority class for glass effects
  if (task.priority === 'HIGH') {
    classes.push('priority-high');
  } else if (task.priority === 'MEDIUM') {
    classes.push('priority-medium');
  }
  
  // Add status class for glass effects
  if (task.status === 'COMPLETED') {
    classes.push('status-completed');
  } else if (task.status === 'ACTIVE') {
    classes.push('status-active');
  }
  
  return classes.join(' ');
}

/**
 * Parse date string as EST timezone
 * All dates entered from UI are in EST
 */
function parseAsEST(dateStr: string): Date {
  // If it's just a date string like "2025-07-12", treat it as EST date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Parse as EST date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date in EST (UTC-5 or UTC-4 depending on DST)
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date;
  }
  
  // For datetime strings, assume they're already in EST
  const date = new Date(dateStr);
  return date;
}

/**
 * Format date in a user-friendly way
 * All dates are treated as EST
 */
export function formatTaskDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  
  // Handle different date formats more robustly
  let date: Date;
  
  // Check if it's a numeric timestamp (possibly corrupted)
  if (/^\d+$/.test(dateStr)) {
    const timestamp = parseInt(dateStr);
    // If it looks like a corrupted timestamp, try to fix it
    if (timestamp < 100000000000) { // Less than year 1973 in milliseconds
      if (import.meta.env.DEV) {
        console.warn('Detected corrupted timestamp, treating as invalid:', dateStr);
      }
      return null; // Return null instead of "Invalid date" to hide the field
    }
    date = new Date(timestamp);
  } else {
    // Parse as EST
    date = parseAsEST(dateStr);
  }
  
  const now = new Date();
  
  // Check for invalid date or dates that are clearly wrong
  if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
    if (import.meta.env.DEV) {
      console.warn('Invalid or suspicious date string:', dateStr, 'parsed as:', date.toISOString());
    }
    return null; // Return null to hide corrupted dates instead of showing confusing info
  }
  
  // Calculate difference using EST dates
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays < 7) return `${diffDays}d`;
  
  // Format as YYYY-Mon-DD (DayOfWeek)
  const year = date.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = monthNames[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = dayNames[date.getDay()];
  
  return `${year}-${month}-${day} (${dayOfWeek})`;
}

/**
 * Check if a task is overdue
 * All dates are treated as EST
 */
export function isTaskOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  
  // Handle different date formats more robustly
  let date: Date;
  
  // Check if it's a numeric timestamp (possibly corrupted)
  if (/^\d+$/.test(dueDate)) {
    const timestamp = parseInt(dueDate);
    // If it looks like a corrupted timestamp, don't treat as overdue
    if (timestamp < 100000000000) { // Less than year 1973 in milliseconds
      if (import.meta.env.DEV) {
        console.warn('Detected corrupted timestamp in overdue check, treating as not overdue:', dueDate);
      }
      return false;
    }
    date = new Date(timestamp);
  } else {
    // Parse as EST
    date = parseAsEST(dueDate);
    // Set to end of day EST for due date comparison
    date.setHours(23, 59, 59, 999);
  }
  
  // Check for invalid date or dates that are clearly wrong
  if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
    if (import.meta.env.DEV) {
      console.warn('Invalid or suspicious due date string:', dueDate);
    }
    return false;
  }
  
  // Compare with current EST time
  const now = new Date();
  return date < now;
}

/**
 * Get color for task priority
 */
export function getPriorityColor(priority: string): 'error' | 'warning' | 'info' | 'default' {
  switch (priority) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'default';
  }
}

/**
 * Get color for task status
 */
export function getStatusColor(status: string): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'WAITING': return 'warning';
    case 'COMPLETED': return 'success';
    default: return 'default';
  }
}
/**
 * Get avatar color for assignee (consistent color based on name)
 */
export function getAssigneeColor(assignee: string): string {
  // Generate a consistent color based on the assignee name
  const colors = [
    '#1976d2', // blue
    '#388e3c', // green
    '#d32f2f', // red
    '#f57c00', // orange
    '#7b1fa2', // purple
    '#0288d1', // light blue
    '#c2185b', // pink
    '#00796b', // teal
    '#fbc02d', // yellow
    '#5d4037', // brown
  ];
  
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < assignee.length; i++) {
    hash = assignee.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Calculate and format time remaining until due date
 * All dates are treated as EST
 */
export function getTimeRemaining(dueDate?: string): string | null {
  if (!dueDate) return null;
  
  // Handle different date formats more robustly
  let date: Date;
  
  // Check if it's a numeric timestamp (possibly corrupted)
  if (/^\d+$/.test(dueDate)) {
    const timestamp = parseInt(dueDate);
    // If it looks like a corrupted timestamp, don't show time remaining
    if (timestamp < 100000000000) {
      return null;
    }
    date = new Date(timestamp);
  } else {
    // Parse as EST
    date = parseAsEST(dueDate);
    // Set to end of day EST for due date comparison
    date.setHours(23, 59, 59, 999);
  }
  
  // Check for invalid date or dates that are clearly wrong
  if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
    return null;
  }
  
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
}

/**
 * Convert text to sentence case (first letter capitalized, rest lowercase)
 */
export function toSentenceCase(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format tag for display (sentence case)
 */
export function formatTag(tag: string): string {
  return toSentenceCase(tag.trim());
}
