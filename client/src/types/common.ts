// Common interface patterns to ensure consistency across components

import { Task, Project } from './index';

// Standardized action callback types
export interface TaskActionCallbacks {
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onUnmarkDone?: (task: Task) => void;
  onStart?: (task: Task) => void;
  onStop?: (task: Task) => void;
  onViewDependencies?: (task: Task) => void;
  onLinkTask?: (task: Task) => void;
}

export interface ProjectActionCallbacks {
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onComplete?: (project: Project) => void;
  onStart?: (project: Project) => void;
  onViewDetails?: (project: Project) => void;
}

// Common component props
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

export interface SelectableProps {
  selected?: boolean;
  onSelect?: (item: Task | Project) => void;
}

export interface CompactModeProps {
  compact?: boolean;
}

// Standardized loading and error states
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Common dialog props
export interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
}

// Standardized form field props
export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

// Common filter types
export interface BaseFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Standardized API response wrapper
export interface StandardApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
