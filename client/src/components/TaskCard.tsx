import React, { memo, useMemo, useCallback } from 'react';
import { useTheme, Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Flag as PriorityIcon,
  AccountTree as DependencyIcon,
  Folder as ProjectIcon,
  Person as PersonIcon,
  Speed as UrgencyIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Task } from '../types';
import { 
  isTaskOverdue,
  toSentenceCase,
  getTaskColorCategory
} from '../utils/taskUtils';
import { parseBackendDate, getTimeRemaining } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  selected?: boolean;
  onSelect?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onUnmarkDone?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onPause?: (task: Task) => void;
  onStart?: (task: Task) => void;
  onLinkTask?: (task: Task) => void;
  compact?: boolean;
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
  onLinkTask
}) => {
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

  const handlePause = useCallback(() => {
    if (onPause) onPause(task);
  }, [onPause, task]);

  const handleLinkTask = useCallback(() => {
    if (onLinkTask) onLinkTask(task);
  }, [onLinkTask, task]);

  const handleStart = useCallback(() => {
    if (onStart) onStart(task);
  }, [onStart, task]);
  
  return (
    <Card
      onClick={() => onSelect && onSelect(task)}
      onDoubleClick={() => onEdit && onEdit(task)}
      tabIndex={0}
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
        {/* First Row: Task Title and Status + Days Remaining */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: task.status === 'ACTIVE' ? 700 : 600,
              textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none',
              fontSize: '1.1rem',
              color: task.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
              flex: 1,
            }}
          >
            {task.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                color: cat.chip,
                backgroundColor: cat.chip + '20',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {toSentenceCase(task.status)}
            </Typography>
            
            {timeRemaining && (
              <Typography 
                variant="h6" 
                color={isOverdue ? 'error.main' : 'text.secondary'}
                sx={{ 
                  fontWeight: 500,
                  fontSize: '1.1rem',
                }}
              >
                {timeRemaining}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Second Row: Description and Date */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          {task.description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.85rem', 
                lineHeight: 1.4,
                flex: 1,
                mr: 1
              }}
            >
              {task.description}
            </Typography>
          )}
          
          {actualDate && (
            <Typography 
              variant="caption" 
              color={isOverdue ? 'error.main' : 'text.secondary'}
              sx={{ 
                fontWeight: 500,
                fontSize: '0.75rem',
                flexShrink: 0
              }}
            >
              {actualDate}
            </Typography>
          )}
        </Box>

        {/* Third Row: Project, Assignee, Priority, Urgency and Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          {/* Left side: Info items */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {task.project && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ProjectIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    fontWeight: 'medium'
                  }}
                >
                  {task.project}
                </Typography>
              </Box>
            )}
            
            {task.assignee && task.assignee.trim() && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
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
            
            {task.priority && task.priority !== 'NONE' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PriorityIcon sx={{ 
                  fontSize: 16, 
                  color: priorityStyle?.color || 'text.secondary' 
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: priorityStyle?.color || 'text.secondary',
                    fontWeight: 'medium'
                  }}
                >
                  {task.priority}
                </Typography>
              </Box>
            )}
            
            {task.urgency != null && task.urgency > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <UrgencyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: 'warning.main',
                    fontWeight: 'medium'
                  }}
                >
                  {task.urgency}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Right side: Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Start/Pause button - conditional based on status */}
            {task.status === 'ACTIVE' ? (
              <IconButton 
                size="small" 
                onClick={handlePause}
                sx={{ color: 'warning.main' }}
                title="Pause"
              >
                <PauseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : (
              <IconButton 
                size="small" 
                onClick={handleStart}
                sx={{ color: 'success.main' }}
                title="Start"
              >
                <StartIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            
            {/* Complete button */}
            <IconButton 
              size="small" 
              onClick={task.status === 'COMPLETED' ? handleUnmarkDone : handleMarkDone}
              sx={{ color: task.status === 'COMPLETED' ? 'text.secondary' : 'success.main' }}
              title={task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Complete'}
            >
              <CompleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
            
            {/* Link button */}
            {onLinkTask && (
              <IconButton 
                size="small" 
                onClick={handleLinkTask}
                sx={{ color: 'primary.main' }}
                title="Link Task"
              >
                <LinkIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            
            {/* Delete button */}
            <IconButton 
              size="small" 
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
              title="Delete"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
            
            {/* Edit button */}
            <IconButton 
              size="small" 
              onClick={handleEdit}
              sx={{ color: 'text.secondary' }}
              title="Edit"
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Fourth Row: Dependencies */}
        {(task.depends && task.depends.length > 0) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <DependencyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="caption" sx={{ color: 'warning.main' }}>
              {task.depends.length} dependencies
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

// Set display name for debugging
TaskCard.displayName = 'TaskCard';

export default TaskCard;
