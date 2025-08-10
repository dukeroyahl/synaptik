import React, { memo, useMemo, useCallback } from 'react';
import { useTheme, Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Flag as PriorityIcon,
  Assignment as ProjectIcon,
  CalendarToday as DueIcon,
  AccountTree as DependencyIcon,
  Tag as TagIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Task } from '../types';
import { 
  generateTaskId,
  isTaskOverdue,
  formatTag,
  toSentenceCase,
  getTaskColorCategory
} from '../utils/taskUtils';
import { getTimeRemaining, parseBackendDate } from '../utils/dateUtils';
import TaskActions from './TaskActions';
import UrgencyChip from './UrgencyChip';

interface TaskCardProps {
  task: Task;
  selected?: boolean;
  onSelect?: (task: Task) => void;
  onViewDependencies?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onUnmarkDone?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onEditDate?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStop?: (task: Task) => void;
  onLinkTask?: (task: Task) => void;
  draggable?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = memo(({
  task,
  selected = false,
  onSelect,
  onViewDependencies,
  onMarkDone,
  onUnmarkDone,
  onEdit,
  onEditDate,
  onDelete,
  onStop,
  onLinkTask,
  draggable = false
}) => {
  const theme = useTheme();
  const semantic = (theme as any).semanticStyles;
  const priorityStyle = task.priority && task.priority !== 'NONE' ? semantic.priority[task.priority] : null;
  const statusStyle = semantic.status[task.status as keyof typeof semantic.status] || semantic.status.PENDING;
  const colorCategory = getTaskColorCategory(task);

  // Map color category to surface/background accent overrides
  const categoryStyles: Record<string, { ring: string; bg: string; chip: string; text: string }> = {
    overdue: {
      ring: theme.palette.error.main,
      bg: theme.palette.mode === 'dark' ? '#2d0f12' : '#ffe5e7',
      chip: theme.palette.error.dark,
      text: theme.palette.error.contrastText || '#fff'
    },
    dueToday: { // Blue
      ring: theme.palette.info.main,
      bg: theme.palette.mode === 'dark' ? '#0f2a38' : '#e3f4ff',
      chip: theme.palette.info.dark,
      text: theme.palette.getContrastText(theme.palette.info.dark)
    },
    completed: {
      ring: theme.palette.success.main,
      bg: theme.palette.mode === 'dark' ? '#0f2416' : '#e6f6ed',
      chip: theme.palette.success.dark,
      text: theme.palette.success.contrastText || '#fff'
    },
    open: { // Yellow
      ring: theme.palette.warning.main,
      bg: theme.palette.mode === 'dark' ? '#33250a' : '#fff6db',
      chip: theme.palette.warning.dark,
      text: theme.palette.getContrastText(theme.palette.warning.dark)
    }
  };
  const cat = categoryStyles[colorCategory];

  // Memoize taskId calculation
  const taskId = useMemo(() => {
    try {
      return generateTaskId(task);
    } catch (error) {
      console.error('Error generating task ID for task', task.id, error);
      return `TASK-${task.id.slice(0, 8)}`;
    }
  }, [task.id, task.title]);
  
  // Memoize time remaining calculation
  const timeRemaining = useMemo(() => {
    try {
      return task.dueDate ? getTimeRemaining(task.dueDate) : null;
    } catch (error) {
      console.error('Error calculating time remaining for task', task.id, error);
      return null;
    }
  }, [task.dueDate, task.id]);

  // Memoize overdue status check
  const isOverdue = useMemo(() => {
    try {
      return task.dueDate ? isTaskOverdue(task.dueDate) : false;
    } catch (error) {
      console.error('Error checking overdue status for task', task.id, error);
      return false;
    }
  }, [task.dueDate, task.id]);

  // Memoize actual date (always shows the calendar date, not relative time)
  const actualDate = useMemo(() => {
    if (!task.dueDate) return null;
    
    try {
      // Use the proper date parsing function to handle timezone issues
      const date = parseBackendDate(task.dueDate);
      // Always format as actual date regardless of how close it is
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'short'
      });
    } catch (error) {
      console.error('Error formatting actual date for task', task.id, error);
      return task.dueDate;
    }
  }, [task.dueDate, task.id]);

  // Memoize event handlers to prevent child re-renders
  const handleEditDate = useCallback(() => {
    if (onEditDate) onEditDate(task);
  }, [onEditDate, task]);

  const handleViewDependencies = useCallback(() => {
    if (onViewDependencies) onViewDependencies(task);
  }, [onViewDependencies, task]);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(task);
  }, [onEdit, task]);

  const handleMarkDone = useCallback(() => {
    if (onMarkDone) onMarkDone(task);
  }, [onMarkDone, task]);

  const handleUnmarkDone = useCallback(() => {
    if (onUnmarkDone) onUnmarkDone(task);
  }, [onUnmarkDone, task]);

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(task);
  }, [onDelete, task]);

  const handleStop = useCallback(() => {
    if (onStop) onStop(task);
  }, [onStop, task]);

  const handleLinkTask = useCallback(() => {
    if (onLinkTask) onLinkTask(task);
  }, [onLinkTask, task]);
  
  return (
  <Card
  onClick={(_e) => {
      // Avoid triggering when clicking interactive child buttons (stop propagation there if needed)
      if (onSelect) onSelect(task);
    }}
    onDoubleClick={(e) => {
      e.stopPropagation();
      if (onEdit) onEdit(task);
    }}
    onKeyDown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && onEdit) {
        e.preventDefault();
        onEdit(task);
      }
    }}
    tabIndex={0}
    sx={(t) => {
      const dark = t.palette.mode === 'dark';
      const ring = cat.ring || (dark ? t.palette.primary.light : t.palette.primary.main);
      const isCompleted = task.status === 'COMPLETED';
      const isStarted = task.status === 'STARTED';
      const isOverdueLocal = colorCategory === 'overdue';
      const active = selected || isCompleted || isStarted || isOverdueLocal; // selection boosts active state
      // Base alphas tuned per state; overdue gets a slightly stronger base and selected jump
      const bg = isOverdueLocal
        ? (selected ? alpha(ring, 0.26) : alpha(ring, 0.12))
        : active
          ? alpha(ring, selected ? 0.24 : 0.18)
          : alpha(ring, 0.06);
      // Unified border color logic to match overview tiles: inactive .22, active .9, selected 1
      const borderColor = active ? alpha(ring, selected ? 1 : 0.9) : alpha(ring, 0.22);
      const radius = 2;

      // --- Dynamic Contrast Handling ---
      // Attempt to approximate final blended background color by blending ring over base surface.
      const parseColor = (c: string): { r: number; g: number; b: number } | null => {
        if (!c) return null;
        // rgba(r,g,b,a)
        const rgbaMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (rgbaMatch) {
          return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3] };
        }
        // hex
        const hex = c.replace('#','');
        if (hex.length === 3) {
          const r = parseInt(hex[0]+hex[0],16);
          const g = parseInt(hex[1]+hex[1],16);
          const b = parseInt(hex[2]+hex[2],16);
          return { r,g,b };
        } else if (hex.length === 6) {
          const r = parseInt(hex.slice(0,2),16);
          const g = parseInt(hex.slice(2,4),16);
          const b = parseInt(hex.slice(4,6),16);
          return { r,g,b };
        }
        return null;
      };
      const relativeLuminance = ({r,g,b}:{r:number;g:number;b:number}) => {
        const srgb = [r,g,b].map(v => {
          const c = v/255;
            return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
        });
        return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
      };
      const contrastRatio = (lum1:number, lum2:number) => {
        const L1 = Math.max(lum1, lum2);
        const L2 = Math.min(lum1, lum2);
        return (L1 + 0.05) / (L2 + 0.05);
      };
      // Extract alpha used in bg string for ring overlay
      const alphaMatch = bg.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/);
      const overlayAlpha = alphaMatch ? parseFloat(alphaMatch[1]) : 0.12;
      const ringRgb = parseColor(ring) || { r: 0, g: 0, b: 0 };
      const baseSurface = parseColor(dark ? '#121212' : '#ffffff')!; // fallback typical surfaces
      // Alpha blend ring over base
      const blended = {
        r: Math.round(ringRgb.r * overlayAlpha + baseSurface.r * (1 - overlayAlpha)),
        g: Math.round(ringRgb.g * overlayAlpha + baseSurface.g * (1 - overlayAlpha)),
        b: Math.round(ringRgb.b * overlayAlpha + baseSurface.b * (1 - overlayAlpha))
      };
      const bgLum = relativeLuminance(blended);
      const whiteLum = relativeLuminance({r:255,g:255,b:255});
      const blackLum = relativeLuminance({r:0,g:0,b:0});
      const contrastWithWhite = contrastRatio(bgLum, whiteLum);
      const contrastWithBlack = contrastRatio(bgLum, blackLum);
      let textColor: string;
      // Prefer theme text.primary if sufficient; else pick better of white/black
      const primaryRgb = parseColor(dark ? '#ffffff' : '#000000')!;
      const primaryLum = relativeLuminance(primaryRgb);
      const contrastWithPrimary = contrastRatio(bgLum, primaryLum);
      if (contrastWithPrimary >= 4.2) {
        textColor = t.palette.text.primary;
      } else {
        textColor = contrastWithWhite > contrastWithBlack ? '#fff' : '#000';
      }

      return {
        position: 'relative',
        mb: 0.25,
  cursor: onSelect ? 'pointer' : (draggable ? 'grab' : 'default'),
        background: bg,
        color: textColor,
        borderRadius: radius,
        overflow: 'hidden',
        border: `1px solid ${borderColor}`,
        boxShadow: active
          ? `${(t as any).ds?.elevation?.[2] || '0 2px 4px rgba(0,0,0,0.12)'}${selected ? `, inset 0 -3px 0 0 ${ring}` : ''}`
          : (t as any).ds?.elevation?.[1] || '0 1px 2px rgba(0,0,0,0.08)',
        ...(isOverdueLocal && selected ? {
          boxShadow: `${(t as any).ds?.elevation?.[3] || '0 3px 8px rgba(0,0,0,0.18)'} , 0 0 0 2px ${alpha(ring,0.55)}, inset 0 -3px 0 0 ${ring}`,
        }: {}),
        transition: 'all 180ms cubic-bezier(.4,.2,.2,1)',
        '&:hover': {
          background: selected
            ? bg
            : (isOverdueLocal ? alpha(ring, 0.26) : alpha(ring, 0.20)),
          transform: 'translateY(-2px)',
          boxShadow: `${(t as any).ds?.elevation?.[3] || '0 3px 8px rgba(0,0,0,0.18)'} , inset 0 -3px 0 0 ${ring}`,
          border: `1px solid ${alpha(ring, 1)}`,
          outline: `2px solid ${alpha(ring,0.65)}`,
          outlineOffset: 0
        },
        ...(selected ? {
          boxShadow: `${(t as any).ds?.elevation?.[3] || '0 3px 8px rgba(0,0,0,0.18)'} , inset 0 -3px 0 0 ${ring}`,
          outline: `2px solid ${alpha(ring,0.65)}`,
          outlineOffset: 0
        }: {}),
        ...(isOverdueLocal && selected ? {
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `linear-gradient(145deg, ${alpha(ring,0.18)} 0%, ${alpha(ring,0)} 60%)`,
            mixBlendMode: 'overlay'
          }
        }: {}),
        '&:focus-within': {
          outline: `2px solid ${alpha(ring,0.6)}`,
          outlineOffset: 0,
          boxShadow: `${(t as any).ds?.elevation?.[2] || '0 2px 6px rgba(0,0,0,0.16)'}, 0 0 0 2px ${alpha(ring,0.35)}, inset 0 -3px 0 0 ${ring}`
        }
      };
    }}
  >
      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
        {/* Header Row: Status, Task ID, Urgency, Assignee, Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(25,118,210,0.15)' 
                  : 'rgba(25,118,210,0.1)',
                borderRadius: '8px',
                padding: '2px 6px',
                border: `1px solid ${theme.palette.primary.main}30`,
              }}
            >
              <TagIcon sx={{ fontSize: 10 }} />
              {taskId}
            </Box>
            
            <Chip
              label={colorCategory === 'open' ? task.status : toSentenceCase(colorCategory)}
              size="small"
              sx={{ 
                fontSize: '0.65rem',
                height: 20,
                fontWeight: 600,
                backgroundColor: cat.chip,
                color: cat.text,
                border: `1px solid ${cat.ring}`,
                letterSpacing: 0.25,
                textTransform: 'uppercase'
              }}
            />

            {/* Project - displayed next to status */}
            {task.project && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ProjectIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    fontWeight: 'medium',
                    backgroundColor: 'action.hover',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {task.project.toUpperCase()}
                </Typography>
              </Box>
            )}

            {task.urgency && task.urgency > 0 && (
              <UrgencyChip urgency={task.urgency} />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.assignee && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ 
                  fontSize: '0.9rem', 
                  color: 'text.secondary',
                  opacity: 0.8
                }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.8rem',
                    fontWeight: 'medium',
                    color: 'text.secondary'
                  }}
                >
                  {toSentenceCase(task.assignee)}
                </Typography>
              </Box>
            )}
            
            <TaskActions
              task={task}
              onEdit={handleEdit}
              onMarkDone={handleMarkDone}
              onUnmarkDone={handleUnmarkDone}
              onDelete={handleDelete}
              onViewDependencies={handleViewDependencies}
              onStop={handleStop}
              onLinkTask={handleLinkTask}
              compact={true}
            />
          </Box>
        </Box>

        {/* Main Content Area with Time Remaining Spanning Vertically (Including Tags) */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Left Content: Priority, Title, Description, and Tags */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            {/* Title and Priority Row */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {task.priority && task.priority !== 'NONE' && (
                <Chip
                  label={task.priority}
                  size="small"
                  icon={<PriorityIcon sx={{ fontSize: 12 }} />}
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 'bold',
                    mt: 0.1,
                    flexShrink: 0,
                    background: priorityStyle?.gradient,
                    border: `1px solid ${priorityStyle?.border}`,
                    color: priorityStyle?.color,
                    '.MuiChip-icon': { color: priorityStyle?.color }
                  }}
                />
              )}
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: task.status === 'STARTED' ? 700 : 600,
                  textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                  fontSize: '1.15rem',
                  lineHeight: 1.3,
                  flex: 1,
                  color: task.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
                  letterSpacing: '0.01em',
                }}
              >
                {task.title}
              </Typography>
            </Box>
            
            {/* Original Input - shown if different from title */}
            {task.originalInput && task.originalInput !== task.title && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  opacity: 0.7,
                  fontStyle: 'italic',
                  mt: 0.2,
                  lineHeight: 1.2,
                }}
              >
                "{task.originalInput}"
              </Typography>
            )}
            
            {/* Description */}
            {task.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.85rem', 
                  lineHeight: 1.4,
                  fontStyle: 'italic',
                  ml: (task.priority && task.priority !== 'NONE') ? 4 : 0
                }}
              >
                {task.description}
              </Typography>
            )}

            {/* Tags - Moved from bottom info row */}
            {task.tags && task.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: (task.priority && task.priority !== 'NONE') ? 4 : 0, mt: 0.1 }}>
                {task.tags.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag}
                    label={`+${formatTag(tag).toUpperCase()}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: 18,
                      borderRadius: 2,
                      margin: 0
                    }}
                  />
                ))}
                {task.tags.length > 3 && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', alignSelf: 'center' }}>
                    +{task.tags.length - 3} more
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Right Side: Due Date - Spanning Vertically (Including Tags) */}
          {task.dueDate ? (
            <Box 
              onClick={handleEditDate}
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.125em',
                ...(isOverdue ? {
                  background: semantic.status.OVERDUE.gradient,
                  border: `1px solid ${semantic.status.OVERDUE.border}`,
                  color: semantic.status.OVERDUE.color
                } : timeRemaining?.includes('today') || timeRemaining?.includes('1 day left') ? {
                  background: semantic.priority.MEDIUM.gradient,
                  border: `1px solid ${semantic.priority.MEDIUM.border}`,
                  color: semantic.priority.MEDIUM.color
                } : {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.primary
                }),
                padding: '0.25em 0.5em',
                borderRadius: '0.375em',
                flexShrink: 0,
                minHeight: task.description || (task.tags && task.tags.length > 0) ? '4.5em' : task.description ? '3.5em' : '2.5em',
                boxShadow: '0 0.0625em 0.1875em rgba(0,0,0,0.1)',
                cursor: onEditDate ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onEditDate ? {
                  boxShadow: theme.ds?.elevation[2],
                  transform: 'scale(1.02)'
                } : {}
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '0.9em',
                  fontWeight: 700,
                  color: 'inherit',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                }}
              >
                {timeRemaining || 'Due Soon'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75em',
                  fontWeight: 500,
                  color: 'inherit',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  opacity: 0.9,
                }}
              >
                 {actualDate}
              </Typography>
            </Box>
          ) : (
            onEditDate && (
              <Box 
                onClick={handleEditDate}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.125em',
                  background: statusStyle.gradient,
                  border: `1px dashed ${statusStyle.border}`,
                  color: statusStyle.color,
                  padding: '0.25em 0.5em',
                  borderRadius: '0.375em',
                  flexShrink: 0,
                  minHeight: task.description || (task.tags && task.tags.length > 0) ? '4.5em' : task.description ? '3.5em' : '2.5em',
                  boxShadow: '0 0.0625em 0.1875em rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  '&:hover': {
                    boxShadow: theme.ds?.elevation[2],
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '0.8em',
                    fontWeight: 500,
                    color: 'inherit',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  No Due Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.125em' }}>
                  <DueIcon sx={{ 
                    fontSize: '0.75em', 
                    color: 'inherit',
                    opacity: 0.8
                  }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7em',
                      fontWeight: 400,
                      color: 'inherit',
                      textAlign: 'center',
                      lineHeight: 1,
                      opacity: 0.8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Click to set
                  </Typography>
                </Box>
              </Box>
            )
          )}
        </Box>

        {/* Compact Info Row: Dependencies Only - Only show if content exists */}
        {(task.depends && Array.isArray(task.depends) && task.depends.length > 0) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, alignItems: 'center', mt: 0.3 }}>
            {/* Dependencies */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DependencyIcon sx={{ fontSize: 14, color: 'warning.main' }} />
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.75rem', color: 'warning.main', fontWeight: 'medium' }}
              >
                {task.depends.length} dep{task.depends.length !== 1 ? 's' : ''}
              </Typography>
              {onViewDependencies && (
                <Chip
                  label="View"
                  size="small"
                  variant="outlined"
                  color="warning"
                  sx={{ 
                    fontSize: '0.65rem', 
                    height: 16,
                    cursor: 'pointer',
                    ml: 0.5
                  }}
                  onClick={handleViewDependencies}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Set display name for debugging
TaskCard.displayName = 'TaskCard';

export default TaskCard;
