import { Theme } from '@mui/material/styles';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface PriorityDisplayConfig {
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
  icon: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  order: number;
}

/**
 * Get standardized priority display configuration
 */
export const getPriorityConfig = (priority: PriorityLevel | undefined, theme: Theme): PriorityDisplayConfig => {
  const configs: Record<PriorityLevel, PriorityDisplayConfig> = {
    HIGH: {
      color: theme.palette.error.main,
      backgroundColor: theme.palette.error.light,
      borderColor: theme.palette.error.main,
      label: 'High Priority',
      icon: '🔴',
      severity: 'error',
      order: 4
    },
    MEDIUM: {
      color: theme.palette.warning.main,
      backgroundColor: theme.palette.warning.light,
      borderColor: theme.palette.warning.main,
      label: 'Medium Priority',
      icon: '🟡',
      severity: 'warning',
      order: 3
    },
    LOW: {
      color: theme.palette.info.main,
      backgroundColor: theme.palette.info.light,
      borderColor: theme.palette.info.main,
      label: 'Low Priority',
      icon: '🔵',
      severity: 'info',
      order: 2
    },
    NONE: {
      color: theme.palette.grey[500],
      backgroundColor: theme.palette.grey[200],
      borderColor: theme.palette.grey[400],
      label: 'No Priority',
      icon: '⚪',
      severity: 'success',
      order: 1
    }
  };
  
  return configs[priority || 'NONE'];
};

/**
 * Get priority display component variants
 */
export const getPriorityDisplayVariant = (
  priority: PriorityLevel | undefined,
  theme: Theme,
  variant: 'dot' | 'chip' | 'text' | 'icon' | 'badge' = 'chip'
): any => {
  const config = getPriorityConfig(priority, theme);
  
  switch (variant) {
    case 'dot':
      return {
        component: 'div',
        sx: {
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: config.color,
          flexShrink: 0
        }
      };
      
    case 'chip':
      return {
        component: 'span',
        sx: {
          fontSize: '0.7rem',
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? '#fff' : config.color,
          backgroundColor: theme.palette.mode === 'dark' ? config.color : config.backgroundColor,
          border: `1px solid ${config.borderColor}`,
          padding: '2px 6px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5
        },
        children: priority?.toLowerCase() || 'none'
      };
      
    case 'text':
      return {
        component: 'span',
        sx: {
          fontSize: '0.75rem',
          color: config.color,
          fontWeight: 'medium',
          textTransform: 'capitalize'
        },
        children: `${priority?.toLowerCase() || 'no'} priority`
      };
      
    case 'icon':
      return {
        component: 'span',
        sx: {
          fontSize: '1rem',
          display: 'inline-flex',
          alignItems: 'center'
        },
        children: config.icon
      };
      
    case 'badge':
      return {
        component: 'div',
        sx: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: '0.75rem',
          color: config.color,
          fontWeight: 'medium',
          padding: '2px 4px',
          borderRadius: 1,
          backgroundColor: theme.palette.mode === 'dark' ? `${config.color}20` : config.backgroundColor
        },
        children: [config.icon, priority?.toLowerCase() || 'none']
      };
      
    default:
      return getPriorityDisplayVariant(priority, theme, 'chip');
  }
};

/**
 * Check if priority should be visually prominent
 */
export const isPriorityProminent = (priority: PriorityLevel | undefined): boolean => {
  return priority === 'HIGH';
};

/**
 * Get priority sort order for lists
 */
export const getPrioritySortOrder = (priority: PriorityLevel | undefined): number => {
  return getPriorityConfig(priority, {} as Theme).order;
};

/**
 * Format priority for display in different contexts
 */
export const formatPriorityForContext = (
  priority: PriorityLevel | undefined,
  context: 'dashboard' | 'list' | 'card' | 'graph' | 'calendar'
): {
  variant: 'dot' | 'chip' | 'text' | 'icon' | 'badge';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
} => {
  switch (context) {
    case 'dashboard':
      return { variant: 'chip', showLabel: true, size: 'small' };
    case 'list':
      return { variant: 'text', showLabel: false, size: 'small' };
    case 'card':
      return { variant: 'text', showLabel: true, size: 'medium' };
    case 'graph':
      return { variant: 'dot', showLabel: false, size: 'large' };
    case 'calendar':
      return { variant: 'badge', showLabel: true, size: 'small' };
    default:
      return { variant: 'chip', showLabel: true, size: 'medium' };
  }
};