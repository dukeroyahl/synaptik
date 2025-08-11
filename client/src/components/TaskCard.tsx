import React, { memo, useMemo, useCallback } from 'react';
import { useTheme, Box, Card, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccountTree as DependencyIcon,
  Folder as ProjectIcon,
  Person as PersonIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { TaskDTO } from '../types';
import { TaskActionCallbacks, BaseComponentProps, SelectableProps, CompactModeProps } from '../types/common';
import { 
  isTaskOverdue,
  toSentenceCase,
  getTaskColorCategory
} from '../utils/taskUtils';
import { parseBackendDate, getTimeRemaining } from '../utils/dateUtils';

interface TaskCardProps extends TaskActionCallbacks, BaseComponentProps, SelectableProps, CompactModeProps {
  task: TaskDTO;
  onPause?: (task: TaskDTO) => void;
  onStop?: (task: TaskDTO) => void;
  draggable?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = memo(({
  task,
  selected = false,
  onSelect,
  onMarkDone,
  onUnmarkDone,
  onEdit,
  onDelete,
  onPause,
  onStart,
  onStop,
  onLinkTask,
  onViewDependencies,
  compact = false,
  className,
  'data-testid': dataTestId
}) => {
  // Suppress unused variable warnings for optional props
  void onStop;
  void onViewDependencies;
  void compact;
  const theme = useTheme();
  const semantic = (theme as any).semanticStyles;
  const colorCategory = getTaskColorCategory(task);

  // Simplified category styles
  const categoryStyles: Record<string, { ring: string; chip: string; text: string }> = {
    overdue: {
      ring: theme.palette.error.main,
      chip: theme.palette.error.main,
      text: theme.palette.error.contrastText || '#fff'
    },
    dueToday: {
      ring: theme.palette.info.main,
      chip: theme.palette.info.main,
      text: theme.palette.info.contrastText || '#fff'
    },
    completed: {
      ring: theme.palette.success.main,
      chip: theme.palette.success.main,
      text: theme.palette.success.contrastText || '#fff'
    },
    open: {
      ring: theme.palette.warning.main,
      chip: theme.palette.warning.main,
      text: theme.palette.warning.contrastText || '#000'
    }
  };
  const cat = categoryStyles[colorCategory];
  const priorityStyle = task.priority && task.priority !== 'NONE' ? semantic?.priority?.[task.priority] : null;

  // Memoize overdue status and date formatting
  const isOverdue = useMemo(() => {
    return task.dueDate ? isTaskOverdue(task.dueDate) : false;
  }, [task.dueDate]);

  const timeRemaining = useMemo(() => {
    return task.dueDate ? getTimeRemaining(task.dueDate) : null;
  }, [task.dueDate]);

  const actualDate = useMemo(() => {
    if (!task.dueDate) return null;
    try {
      const date = parseBackendDate(task.dueDate);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return task.dueDate;
    }
  }, [task.dueDate]);

  // Memoize event handlers
  const handleEdit = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    } else {
    }
  }, [onEdit, task]);

  const handleMarkDone = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onMarkDone) onMarkDone(task);
  }, [onMarkDone, task]);

  const handleUnmarkDone = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onUnmarkDone) onUnmarkDone(task);
  }, [onUnmarkDone, task]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDelete) onDelete(task);
  }, [onDelete, task]);

  const handlePause = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onPause) onPause(task);
  }, [onPause, task]);

  const handleLinkTask = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onLinkTask) onLinkTask(task);
  }, [onLinkTask, task]);

  const handleStart = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onStart) onStart(task);
  }, [onStart, task]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't interfere with typing in nested inputs
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect) onSelect(task);
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (onEdit) onEdit(task);
        }
        break;
      case 'd':
      case 'D':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (onDelete) onDelete(task);
        }
        break;
      case 'c':
      case 'C':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (task.status === 'COMPLETED' && onUnmarkDone) {
            onUnmarkDone(task);
          } else if (onMarkDone) {
            onMarkDone(task);
          }
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (task.status === 'ACTIVE' && onPause) {
            onPause(task);
          } else if (onStart) {
            onStart(task);
          }
        }
        break;
      default:
        break;
    }
  }, [task, onSelect, onEdit, onDelete, onMarkDone, onUnmarkDone, onPause, onStart]);
  
  return (
    <Tooltip 
      title={onEdit ? "Keyboard shortcuts: Enter/Space=Select, E=Edit, C=Complete, S=Start/Pause, D=Delete" : "Press Enter or Space to select"} 
      placement="top"
      arrow
    >
      <Card
        onClick={() => onSelect && onSelect(task)}
        onDoubleClick={() => onEdit && onEdit(task)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={className}
        data-testid={dataTestId}
        sx={{
        mb: 1,
        p: 0,
        borderRadius: 2,
        cursor: onSelect ? 'pointer' : 'default',
        border: `1px solid ${cat.ring}40`,
        borderBottom: `1px solid ${cat.ring}40`,
        background: selected 
          ? alpha(cat.ring, 0.08)
          : theme.palette.background.paper,
        '&:hover': {
          background: alpha(cat.ring, 0.20),
          borderBottom: `4px solid ${cat.ring}`,
          borderTop: `1px solid ${cat.ring}40`,
          borderLeft: `1px solid ${cat.ring}40`,
          borderRight: `1px solid ${cat.ring}40`,
        },
        ...(selected && {
          borderColor: cat.ring,
          boxShadow: theme.shadows[2]
        })
      }}
    >
      <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
        {/* First Row: Task Title and Key Status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: task.status === 'ACTIVE' ? 700 : 600,
                textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: task.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
                lineHeight: 1.3,
                wordBreak: 'break-word'
              }}
            >
              {task.title}
            </Typography>
            
            {/* Description - only show if compact mode is off */}
            {!compact && task.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>
          
          {/* Priority visual indicator and time remaining */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexShrink: 0 }}>
            {/* High priority indicator */}
            {task.priority === 'HIGH' && (
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                mt: 0.75
              }} />
            )}
            
            {timeRemaining && (
              <Typography 
                variant="caption" 
                color={isOverdue ? 'error.main' : 'text.secondary'}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textAlign: 'right',
                  lineHeight: 1.2
                }}
              >
                {timeRemaining}
                {actualDate && (
                  <Box component="span" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                    {actualDate}
                  </Box>
                )}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Second Row: Project, Assignee and Status Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
            {task.projectName && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ProjectIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    fontWeight: 'medium'
                  }}
                >
                  {task.projectName}
                </Typography>
              </Box>
            )}
            
            {task.assignee && task.assignee.trim() && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    fontWeight: 'medium'
                  }}
                >
                  {toSentenceCase(task.assignee)}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Status badge - more prominent */}
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem',
              fontWeight: 700,
              color: cat.text,
              backgroundColor: cat.chip,
              padding: '3px 8px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              flexShrink: 0
            }}
          >
            {toSentenceCase(task.status)}
          </Typography>
        </Box>

        {/* Third Row: Action Buttons and Additional Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0 : 0.5 }}>
          {/* Left side: Additional metadata (only show if not compact) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {!compact && task.priority && task.priority !== 'NONE' && task.priority !== 'HIGH' && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem', 
                  color: priorityStyle?.color || 'text.secondary',
                  fontWeight: 'medium',
                  textTransform: 'capitalize'
                }}
              >
                {task.priority.toLowerCase()} priority
              </Typography>
            )}
            
          </Box>
          
          {/* Right side: Action buttons */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, // Reduced gap
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            borderRadius: 1,
            p: 0.25, // Reduced padding
            backdropFilter: 'blur(2px)'
          }}>
            {/* Edit button */}
            <IconButton 
              size="small" 
              onClick={handleEdit}
              sx={{ 
                color: 'text.secondary',
                backgroundColor: 'transparent',
                width: { xs: 32, sm: 24 },
                height: { xs: 32, sm: 24 },
                minWidth: { xs: 32, sm: 'auto' },
                minHeight: { xs: 32, sm: 'auto' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                }
              }}
              title="Edit Task"
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
            
            {/* Start/Pause button - conditional based on status */}
            {task.status === 'ACTIVE' ? (
              <IconButton 
                size="small" 
                onClick={handlePause}
                sx={{ 
                  color: 'text.secondary',
                  backgroundColor: 'transparent',
                  width: { xs: 32, sm: 24 },
                  height: { xs: 32, sm: 24 },
                  minWidth: { xs: 32, sm: 'auto' },
                  minHeight: { xs: 32, sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'warning.main'
                  }
                }}
                title="Pause"
              >
                <PauseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            ) : (
              <IconButton 
                size="small" 
                onClick={handleStart}
                sx={{ 
                  color: 'text.secondary',
                  backgroundColor: 'transparent',
                  width: { xs: 32, sm: 24 },
                  height: { xs: 32, sm: 24 },
                  minWidth: { xs: 32, sm: 'auto' },
                  minHeight: { xs: 32, sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'success.main'
                  }
                }}
                title="Start"
              >
                <StartIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
            
            {/* Complete button */}
            <IconButton 
              size="small" 
              onClick={task.status === 'COMPLETED' ? handleUnmarkDone : handleMarkDone}
              sx={{ 
                color: task.status === 'COMPLETED' ? 'success.main' : 'text.secondary',
                backgroundColor: 'transparent',
                width: { xs: 32, sm: 24 },
                height: { xs: 32, sm: 24 },
                minWidth: { xs: 32, sm: 'auto' },
                minHeight: { xs: 32, sm: 'auto' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'success.main'
                }
              }}
              title={task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Complete'}
            >
              <CompleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
            
            {/* Link button */}
            {onLinkTask && (
              <IconButton 
                size="small" 
                onClick={handleLinkTask}
                sx={{ 
                  color: 'text.secondary',
                  backgroundColor: 'transparent',
                  width: { xs: 32, sm: 24 },
                  height: { xs: 32, sm: 24 },
                  minWidth: { xs: 32, sm: 'auto' },
                  minHeight: { xs: 32, sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'info.main'
                  }
                }}
                title="Link Task"
              >
                <LinkIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
            
            {/* Delete button */}
            <IconButton 
              size="small" 
              onClick={handleDelete}
              sx={{ 
                color: 'text.secondary',
                backgroundColor: 'transparent',
                width: { xs: 32, sm: 24 },
                height: { xs: 32, sm: 24 },
                minWidth: { xs: 32, sm: 'auto' },
                minHeight: { xs: 32, sm: 'auto' },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'error.main'
                }
              }}
              title="Delete"
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Dependencies indicator - only show if not compact */}
        {!compact && (task.depends && task.depends.length > 0) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <DependencyIcon sx={{ fontSize: 12, color: 'warning.main' }} />
            <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.7rem' }}>
              {task.depends.length} dep{task.depends.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
    </Tooltip>
  );
});

// Set display name for debugging
TaskCard.displayName = 'TaskCard';

export default TaskCard;
