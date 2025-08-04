import React, { memo, useCallback, useMemo } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as DoneIcon,
  Delete as DeleteIcon,
  AccountTree as DependencyIcon,
  Stop as StopIcon,
  Refresh as UndoIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { Task } from '../types';

interface TaskActionsProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onUnmarkDone?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onViewDependencies?: (task: Task) => void;
  onStop?: (task: Task) => void;
  onLinkTask?: (task: Task) => void;
  compact?: boolean;
}

const TaskActions: React.FC<TaskActionsProps> = memo(({
  task,
  onEdit,
  onMarkDone,
  onUnmarkDone,
  onDelete,
  onViewDependencies,
  onStop,
  onLinkTask,
  compact = false
}) => {
  // Memoize button sizes to prevent recalculation
  const buttonSize = useMemo(() => compact ? "small" : "medium", [compact]);
  const iconSize = useMemo(() => compact ? { fontSize: 14 } : { fontSize: 18 }, [compact]);

  // Memoize action handler to prevent recreation on every render
  const handleAction = useCallback((
    callback?: (task: Task) => void,
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    if (callback) {
      callback(task);
    }
  }, [task]);

  // Memoize individual handlers to prevent TaskCard re-renders
  const handleEdit = useCallback((e: React.MouseEvent) => 
    handleAction(onEdit, e), [handleAction, onEdit]);
  
  const handleViewDependencies = useCallback((e: React.MouseEvent) => 
    handleAction(onViewDependencies, e), [handleAction, onViewDependencies]);
  
  const handleStop = useCallback((e: React.MouseEvent) => 
    handleAction(onStop, e), [handleAction, onStop]);
  
  const handleMarkDone = useCallback((e: React.MouseEvent) => 
    handleAction(onMarkDone, e), [handleAction, onMarkDone]);
  
  const handleUnmarkDone = useCallback((e: React.MouseEvent) => 
    handleAction(onUnmarkDone, e), [handleAction, onUnmarkDone]);
  
  const handleLinkTask = useCallback((e: React.MouseEvent) => 
    handleAction(onLinkTask, e), [handleAction, onLinkTask]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => 
    handleAction(onDelete, e), [handleAction, onDelete]);

  // Memoize conditional visibility checks
  const showDependencies = useMemo(() => 
    onViewDependencies && task.depends && task.depends.length > 0, 
    [onViewDependencies, task.depends]
  );
  
  const showStop = useMemo(() => 
    task.status !== 'completed' && task.status === 'ACTIVE' && onStop, 
    [task.status, onStop]
  );
  
  const showMarkDone = useMemo(() => 
    task.status !== 'completed' && onMarkDone, 
    [task.status, onMarkDone]
  );
  
  const showUnmarkDone = useMemo(() => 
    task.status === 'COMPLETED' && onUnmarkDone, 
    [task.status, onUnmarkDone]
  );

  return (
    <Box 
      onClick={(e) => e.stopPropagation()}
      sx={{ 
        display: 'flex', 
        gap: 0.25,
        alignItems: 'center'
      }}
    >
      {/* Edit button */}
      {onEdit && (
        <Tooltip title="Edit task" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'primary.main',
              color: compact ? 'primary.main' : 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleEdit}
          >
            <EditIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}

      {/* View Dependencies button */}
      {showDependencies && (
        <Tooltip title="View dependencies" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'warning.main',
              color: compact ? 'warning.main' : 'white',
              '&:hover': {
                backgroundColor: 'warning.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleViewDependencies}
          >
            <DependencyIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}

      {/* Start/Stop button */}
      {showStop && (
        <Tooltip title="Stop task" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'warning.main',
              color: compact ? 'warning.main' : 'white',
              '&:hover': {
                backgroundColor: 'warning.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleStop}
          >
            <StopIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}

      {/* Mark as Done button */}
      {showMarkDone && (
        <Tooltip title="Mark as done" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'success.main',
              color: compact ? 'success.main' : 'white',
              '&:hover': {
                backgroundColor: 'success.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleMarkDone}
          >
            <DoneIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Unmark Done button for completed tasks */}
      {showUnmarkDone && (
        <Tooltip title="Mark as not done" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'info.main',
              color: compact ? 'info.main' : 'white',
              '&:hover': {
                backgroundColor: 'info.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleUnmarkDone}
          >
            <UndoIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}

      {/* Link Task button */}
      {onLinkTask && (
        <Tooltip title="Link to another task" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'secondary.main',
              color: compact ? 'secondary.main' : 'white',
              '&:hover': {
                backgroundColor: 'secondary.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleLinkTask}
          >
            <LinkIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete button */}
      {onDelete && (
        <Tooltip title="Delete task" TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : 'error.main',
              color: compact ? 'error.main' : 'white',
              '&:hover': {
                backgroundColor: 'error.dark',
                color: 'white',
                transform: compact ? 'scale(1.05)' : 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={handleDelete}
          >
            <DeleteIcon sx={iconSize} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
});

// Set display name for debugging
TaskActions.displayName = 'TaskActions';

export default TaskActions;
