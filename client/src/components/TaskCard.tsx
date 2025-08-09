import React, { memo, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
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
  getTaskCardClass,
  isTaskOverdue,
  getPriorityColor,
  getStatusColor,
  formatTag,
  toSentenceCase
} from '../utils/taskUtils';
import { getTimeRemaining, parseBackendDate } from '../utils/dateUtils';
import TaskActions from './TaskActions';

interface TaskCardProps {
  task: Task;
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
  
  // Memoize taskId calculation
  const taskId = useMemo(() => {
    try {
      return generateTaskId(task);
    } catch (error) {
      console.error('Error generating task ID for task', task.id, error);
      return `TASK-${task.id.slice(0, 8)}`;
    }
  }, [task.id, task.title]);
  
  // Memoize glass color calculation to prevent recalculating on every render
  const glassColor = useMemo(() => {
    // Priority-based colors (high contrast)
    if (task.priority === 'HIGH') {
      return 'linear-gradient(135deg, rgba(255,107,107,0.12) 0%, rgba(255,107,107,0.06) 50%, rgba(255,255,255,0.04) 100%)';
    } else if (task.priority === 'MEDIUM') {
      return 'linear-gradient(135deg, rgba(249,194,60,0.12) 0%, rgba(249,194,60,0.06) 50%, rgba(255,255,255,0.04) 100%)';
    }
    
    // Status-based colors (high contrast)
    if (task.status === 'COMPLETED') {
      return 'linear-gradient(135deg, rgba(86,211,100,0.12) 0%, rgba(86,211,100,0.06) 50%, rgba(255,255,255,0.04) 100%)';
    } else if (task.status === 'ACTIVE') {
      return 'linear-gradient(135deg, rgba(88,166,255,0.12) 0%, rgba(88,166,255,0.06) 50%, rgba(255,255,255,0.04) 100%)';
    }
    
    // Default glass effect (high contrast)
    return 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.06) 100%)';
  }, [task.priority, task.status]);
  
  // Memoize border color calculation
  const borderColor = useMemo(() => {
    if (task.priority === 'HIGH') {
      return 'rgba(255,107,107,0.25)';
    } else if (task.priority === 'MEDIUM') {
      return 'rgba(249,194,60,0.25)';
    } else if (task.status === 'COMPLETED') {
      return 'rgba(86,211,100,0.25)';
    } else if (task.status === 'ACTIVE') {
      return 'rgba(88,166,255,0.25)';
    }
    
    return 'rgba(255,255,255,0.15)';
  }, [task.priority, task.status]);

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
      sx={{ 
        mb: 0.5,
        position: 'relative',
        opacity: task.status === 'COMPLETED' ? 0.85 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: draggable ? 'grab' : 'default',
        background: glassColor,
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
          border: `1px solid ${borderColor.replace(/0\.\d+/, '0.4')}`,
          backdropFilter: 'blur(24px) saturate(2)',
          WebkitBackdropFilter: 'blur(24px) saturate(2)',
        },
        '&:active': draggable ? {
          cursor: 'grabbing',
          transform: 'translateY(0px)',
        } : {},
        // Add subtle shimmer effect
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transition: 'left 0.5s',
          pointerEvents: 'none',
        },
        '&:hover::before': {
          left: '100%',
        }
      }}
      className={`glass-card task-card-glass ${getTaskCardClass(task)}`}
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
              label={task.status}
              size="small"
              color={getStatusColor(task.status)}
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                fontWeight: 'medium'
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
              <Chip
                label={`${task.urgency.toFixed(1)}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  fontWeight: 'bold'
                }}
              />
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
                  color={getPriorityColor(task.priority)}
                  icon={<PriorityIcon sx={{ fontSize: 12 }} />}
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 'bold',
                    mt: 0.1,
                    flexShrink: 0
                  }}
                />
              )}
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: task.status === 'ACTIVE' ? 700 : 600,
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
                backgroundColor: isOverdue ? 'rgba(255,107,107,0.15)' : 
                                timeRemaining?.includes('today') ? 'rgba(249,194,60,0.15)' : 
                                timeRemaining?.includes('1 day left') ? 'rgba(249,194,60,0.15)' : 
                                'rgba(255,255,255,0.08)',
                padding: '0.25em 0.5em',
                borderRadius: '0.375em',
                flexShrink: 0,
                minHeight: task.description || (task.tags && task.tags.length > 0) ? '4.5em' : task.description ? '3.5em' : '2.5em', // Reduced height for 2 lines
                border: `1px solid ${
                  isOverdue ? 'rgba(255,107,107,0.3)' : 
                  timeRemaining?.includes('today') ? 'rgba(249,194,60,0.3)' : 
                  timeRemaining?.includes('1 day left') ? 'rgba(249,194,60,0.3)' : 
                  'rgba(255,255,255,0.15)'
                }`,
                boxShadow: '0 0.0625em 0.1875em rgba(0,0,0,0.1)',
                cursor: onEditDate ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onEditDate ? {
                  backgroundColor: isOverdue ? 'rgba(255,107,107,0.2)' : 
                                  timeRemaining?.includes('today') ? 'rgba(249,194,60,0.2)' : 
                                  timeRemaining?.includes('1 day left') ? 'rgba(249,194,60,0.2)' : 
                                  'rgba(255,255,255,0.12)',
                  border: `1px solid ${
                    isOverdue ? 'rgba(255,107,107,0.4)' : 
                    timeRemaining?.includes('today') ? 'rgba(249,194,60,0.4)' : 
                    timeRemaining?.includes('1 day left') ? 'rgba(249,194,60,0.4)' : 
                    'rgba(255,255,255,0.25)'
                  }`,
                  transform: 'scale(1.02)',
                } : {}
              }}
            >
              {/* Time Remaining - Primary Display */}
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '0.9em',
                  fontWeight: 700,
                  color: isOverdue ? '#ff6b6b' : 
                         timeRemaining?.includes('today') ? '#f9c23c' : 
                         timeRemaining?.includes('1 day left') ? '#f9c23c' : 
                         '#f0f6fc',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                }}
              >
                {timeRemaining || 'Due Soon'}
              </Typography>
              
              {/* Full Date Display - Always Show Actual Date */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75em',
                  fontWeight: 500,
                  color: isOverdue ? '#ff6b6b' : '#e6edf3',
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
            /* Add Due Date Chip - Only show if onEditDate is available */
            onEditDate && (
              <Box 
                onClick={handleEditDate}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.125em',
                  backgroundColor: 'rgba(88,166,255,0.08)',
                  padding: '0.25em 0.5em',
                  borderRadius: '0.375em',
                  flexShrink: 0,
                  minHeight: task.description || (task.tags && task.tags.length > 0) ? '4.5em' : task.description ? '3.5em' : '2.5em',
                  border: '1px dashed rgba(88,166,255,0.3)',
                  boxShadow: '0 0.0625em 0.1875em rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(88,166,255,0.12)',
                    border: '1px dashed rgba(88,166,255,0.5)',
                    transform: 'scale(1.02)',
                  }
                }}
              >
                {/* Add Due Date Text */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '0.8em',
                    fontWeight: 500,
                    color: '#58a6ff',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  No Due Date
                </Typography>
                
                {/* Calendar Icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.125em' }}>
                  <DueIcon sx={{ 
                    fontSize: '0.75em', 
                    color: '#58a6ff',
                    opacity: 0.8
                  }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7em',
                      fontWeight: 400,
                      color: '#58a6ff',
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
