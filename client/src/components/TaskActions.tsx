import React, { memo, useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Tooltip, Fade, Menu, MenuItem } from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as DoneIcon,
  Delete as DeleteIcon,
  AccountTree as DependencyIcon,
  Stop as StopIcon,
  Refresh as UndoIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Task } from '../types';
import { TaskActionCallbacks, CompactModeProps } from '../types/common';

interface TaskActionsProps extends TaskActionCallbacks, CompactModeProps {
  task: Task;
  onStop?: (task: Task) => void;
}

const TaskActionsComponent: React.FC<TaskActionsProps> = ({
  task,
  onEdit,
  onMarkDone,
  onUnmarkDone,
  onDelete,
  onViewDependencies,
  onStop,
  onStart,
  onLinkTask,
  compact = false
}) => {
  // Suppress unused variable warning for optional prop
  void onStart;
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
    if (callback) callback(task);
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
    task.status !== 'COMPLETED' && task.status === 'ACTIVE' && onStop, 
    [task.status, onStop]
  );
  
  const showMarkDone = useMemo(() => 
    task.status !== 'COMPLETED' && onMarkDone, 
    [task.status, onMarkDone]
  );
  
  const showUnmarkDone = useMemo(() => 
    task.status === 'COMPLETED' && onUnmarkDone, 
    [task.status, onUnmarkDone]
  );

  // Collect all available actions in order
  const actions = ([
    onEdit ? {
      key: 'edit',
      label: 'Edit task',
      icon: <EditIcon sx={iconSize} />, handler: handleEdit
    } : null,
    showMarkDone ? {
      key: 'markDone',
      label: 'Mark as done',
      icon: <DoneIcon sx={iconSize} />, handler: handleMarkDone
    } : null,
    showUnmarkDone ? {
      key: 'unmarkDone',
      label: 'Mark as not done',
      icon: <UndoIcon sx={iconSize} />, handler: handleUnmarkDone
    } : null,
    showDependencies ? {
      key: 'dependencies',
      label: 'View dependencies',
      icon: <DependencyIcon sx={iconSize} />, handler: handleViewDependencies
    } : null,
    showStop ? {
      key: 'stop',
      label: 'Stop task',
      icon: <StopIcon sx={iconSize} />, handler: handleStop
    } : null,
    onLinkTask ? {
      key: 'link',
      label: 'Link to another task',
      icon: <LinkIcon sx={iconSize} />, handler: handleLinkTask
    } : null,
    onDelete ? {
      key: 'delete',
      label: 'Delete task',
      icon: <DeleteIcon sx={iconSize} />, handler: handleDelete
    } : null
  ] as (null | { key: string; label: string; icon: JSX.Element; handler: (e: React.MouseEvent) => void })[]).filter((a): a is { key: string; label: string; icon: JSX.Element; handler: (e: React.MouseEvent) => void } => a !== null);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const mainActions = actions.slice(0, 3);
  const menuActions = actions.slice(3);

  return (
    <Box 
      onClick={(e) => e.stopPropagation()}
      sx={{ 
        display: 'flex', 
        gap: 0.25,
        alignItems: 'center'
      }}
    >
      {mainActions.map(action => (
        <Tooltip key={action.key} title={action.label} TransitionComponent={Fade}>
          <IconButton
            size={buttonSize}
            sx={{
              backgroundColor: compact ? 'transparent' : undefined,
              color: compact ? undefined : 'inherit',
              transition: 'all 0.2s ease'
            }}
            onClick={action.handler}
          >
            {action.icon}
          </IconButton>
        </Tooltip>
      ))}
      {menuActions.length > 0 && (
        <>
          <IconButton
            size={buttonSize}
            onClick={handleMenuOpen}
            sx={{
              backgroundColor: compact ? 'transparent' : undefined,
              color: compact ? undefined : 'inherit',
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {menuActions.map(action => (
              <MenuItem key={action.key} onClick={e => { action.handler(e); handleMenuClose(); }}>
                {action.icon}
                {action.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

const TaskActions = memo(TaskActionsComponent);
TaskActions.displayName = 'TaskActions';
export default TaskActions;
