import { Task } from '../types';
import { darkPalette } from './themeUtils';
import { parseBackendDate } from './dateUtils';

// Determine if a task is urgent based on due date
export function isUrgent(task: Task): boolean {
  if (!task.dueDate) return false;
  
  try {
    const due = parseBackendDate(task.dueDate);
    
    // Set to end of day for date-only strings
    if (task.dueDate.length === 10 || !task.dueDate.includes('T')) {
      due.setHours(23, 59, 59, 999);
    }
    
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30; // due within 30 days (including today) or overdue
  } catch {
    return false;
  }
}

// Determine if a task is important based on priority
export function isImportant(task: Task): boolean {
  return task.priority === 'HIGH' || task.priority === 'MEDIUM';
}

// Get the Eisenhower quadrant for a task (0-3)
export function getQuadrant(task: Task): number {
  const urgent = isUrgent(task);
  const important = isImportant(task);
  
  if (urgent && important) return 0; // Urgent & Important
  if (!urgent && important) return 1; // Important but Not Urgent
  if (urgent && !important) return 2; // Urgent but Not Important
  return 3; // Not Urgent & Not Important
}

// Get color for each quadrant - using soft pastel colors
export function getQuadrantColor(quadrant: number): string {
  switch (quadrant) {
    case 0: return darkPalette.error; // Urgent & Important - Soft rose
    case 1: return darkPalette.orange; // Important but Not Urgent - Soft orange
    case 2: return darkPalette.info; // Urgent but Not Important - Soft blue
    case 3: return darkPalette.purple; // Not Urgent & Not Important - Soft purple
    default: return darkPalette.textSecondary;
  }
}

// Get background color with transparency for glass effect
export function getQuadrantBackgroundColor(quadrant: number, isDarkMode: boolean): string {
  const alpha = isDarkMode ? '15' : '10'; // Hex alpha value (0-FF)
  
  switch (quadrant) {
    case 0: return `${darkPalette.error}${alpha}`; // Urgent & Important
    case 1: return `${darkPalette.orange}${alpha}`; // Important but Not Urgent
    case 2: return `${darkPalette.info}${alpha}`; // Urgent but Not Important
    case 3: return `${darkPalette.purple}${alpha}`; // Not Urgent & Not Important
    default: return `${darkPalette.textSecondary}${alpha}`;
  }
}

// Get border color for each quadrant
export function getQuadrantBorderColor(quadrant: number): string {
  switch (quadrant) {
    case 0: return darkPalette.error; // Urgent & Important
    case 1: return darkPalette.orange; // Important but Not Urgent
    case 2: return darkPalette.info; // Urgent but Not Important
    case 3: return darkPalette.purple; // Not Urgent & Not Important
    default: return darkPalette.textSecondary;
  }
}

// Get quadrant label
export function getQuadrantLabel(quadrant: number): string {
  switch (quadrant) {
    case 0: return 'Urgent & Important';
    case 1: return 'Important, Not Urgent';
    case 2: return 'Urgent, Not Important';
    case 3: return 'Not Urgent or Important';
    default: return '';
  }
}
