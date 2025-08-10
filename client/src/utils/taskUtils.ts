import { Task } from '../types'
import { parseBackendDate, formatDateFromBackend } from './dateUtils';
import { getQuadrant } from './eisenhowerUtils';

/**
 * Convert text to sentence case (first letter uppercase, rest lowercase)
 */
export function toSentenceCase(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Generate a short, readable task ID from MongoDB ObjectId or externalId
 * Format: SYN-XXXX (e.g., SYN-1A2B)
 */
export function generateTaskId(task: Task): string {
  if (!task || !task.id) {
    if (import.meta.env.DEV) {
      console.warn('Task or task.id is missing, using default ID');
    }
    return 'SYN-0000';
  }
  
  try {
    // Use last 4 chars of MongoDB ObjectId, ensuring we have at least 4 chars
    const id = task.id;
    if (id.length < 4) {
      // Pad with zeros if ID is too short
      return `SYN-${id.padStart(4, '0').toUpperCase()}`;
    }
    return `SYN-${id.slice(-4).toUpperCase()}`;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error generating task ID for task:', task, error);
    }
    return 'SYN-ERR0';
  }
}

/**
 * Get CSS class for task card based on priority, status, and Eisenhower quadrant
 */
export function getTaskCardClass(task: Task): string {
  if (!task) {
    if (import.meta.env.DEV) {
      console.warn('Task is null/undefined in getTaskCardClass');
    }
    return '';
  }
  
  try {
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
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error generating task card class for task:', task, error);
    }
    return '';
  }
}


/**
 * Format date in a user-friendly way
 * All dates are treated as EST
 */
export function formatTaskDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  
  try {
    // Handle different date formats more robustly
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
      dateStr = new Date(timestamp).toISOString();
    }
    
    // Use the unified date formatting function
    return formatDateFromBackend(dateStr, 'fullDate');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error formatting task date:', dateStr, error);
    }
    return null;
  }
}

/**
 * Check if a task is overdue
 * All dates are treated as EST
 */
export function isTaskOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  
  try {
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
      // Parse using backend date format
      date = parseBackendDate(dueDate);
      // Set to end of day for due date comparison (if it's just a date without time)
      if (dueDate.length === 10 || !dueDate.includes('T')) {
        date.setHours(23, 59, 59, 999);
      }
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
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error checking if task is overdue:', dueDate, error);
    }
    return false;
  }
}

/**
 * Check if a task is due today (local date match, not overdue yet)
 */
export function isTaskDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  try {
    let date: Date;
    if (/^\d+$/.test(dueDate)) {
      const timestamp = parseInt(dueDate);
      if (timestamp < 100000000000) return false;
      date = new Date(timestamp);
    } else {
      date = parseBackendDate(dueDate);
    }
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  } catch {
    return false;
  }
}

/**
 * Derive a simplified color category for a task:
 * - overdue
 * - dueToday
 * - completed
 * - open (default: pending/started)
 */
export function getTaskColorCategory(task: import('../types').Task): 'overdue' | 'dueToday' | 'completed' | 'open' {
  if (task.status === 'COMPLETED') return 'completed';
  if (task.dueDate) {
    if (isTaskOverdue(task.dueDate)) return 'overdue';
    if (isTaskDueToday(task.dueDate)) return 'dueToday';
  }
  return 'open';
}

/**
 * Get avatar color for assignee (consistent color based on name)
 */
export function getAssigneeColor(assignee: string): string {
  if (!assignee || typeof assignee !== 'string') {
    return '#1976d2'; // Default blue color
  }
  
  try {
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
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error generating assignee color for:', assignee, error);
    }
    return '#1976d2'; // Fallback to blue
  }
}


/**
 * Format tag for display (sentence case)
 */
export function formatTag(tag: string): string {
  if (!tag || typeof tag !== 'string') return '';
  
  try {
    return toSentenceCase(tag.trim());
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error formatting tag:', tag, error);
    }
    return tag || '';
  }
}
