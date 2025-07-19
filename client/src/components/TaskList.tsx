import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme
} from '@mui/material'
import { Task } from '../types'
import TaskEditDialog from './TaskEditDialog'
import TaskDependencyView from './TaskDependencyView'
import TaskCard from './TaskCard'
import LinkTaskDialog from './LinkTaskDialog'
import { API_BASE_URL } from '../config'

interface TaskListProps {
  filter?: 'pending' | 'active' | 'overdue' | 'today' | 'completed' | 'all'
  onTaskUpdate?: (task: Task) => void
  assigneeFilter?: string
  projectFilter?: string
  dueDateFilter?: string
}

const TaskList: React.FC<TaskListProps> = memo(({ 
  filter = 'pending', 
  onTaskUpdate, 
  assigneeFilter = '',
  projectFilter = '',
  dueDateFilter = ''
}) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [dependencyViewOpen, setDependencyViewOpen] = useState(false)
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null)
  const [linkTaskDialogOpen, setLinkTaskDialogOpen] = useState(false)
  const [linkingTask, setLinkingTask] = useState<Task | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      let endpoint = '/api/tasks'
      
      switch (filter) {
        case 'pending':
          endpoint = '/api/tasks/pending'
          break
        case 'active':
          endpoint = '/api/tasks/active'
          break
        case 'overdue':
          endpoint = '/api/tasks/overdue'
          break
        case 'today':
          endpoint = '/api/tasks/today'
          break
        case 'completed':
          endpoint = '/api/tasks?status=completed'
          break
        default:
          endpoint = '/api/tasks'
      }

      // Add assignee filter if provided
      if (assigneeFilter) {
        endpoint += endpoint.includes('?') ? '&' : '?'
        endpoint += `assignee=${encodeURIComponent(assigneeFilter)}`
      }

      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(fullUrl)
      const result = await response.json()
      
      if (response.ok) {
        setTasks(Array.isArray(result) ? result : [])
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch tasks:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [filter, assigneeFilter])

  const handleTaskAction = useCallback(async (taskId: string, action: 'done' | 'delete' | 'start' | 'stop' | 'undone') => {
    try {
      let endpoint = `/api/tasks/${taskId}`
      let method = 'POST'
      
      if (action === 'delete') {
        endpoint = `/api/tasks/${taskId}` // Use the simpler delete route
        method = 'DELETE'
      } else {
        endpoint = `/api/tasks/${taskId}/${action}`
      }

      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(fullUrl, { 
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      
      if (!response.ok) {
        const errorText = await response.text()
        if (import.meta.env.DEV) {
          console.error(`Request failed with status ${response.status}:`, errorText)
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      // Handle different response types
      let result = null
      if (action === 'delete') {
        // Delete returns 204 No Content, no JSON body
        result = { success: true }
      } else {
        result = await response.json()
      }

      if (response.ok) {
        await fetchTasks() // Refresh the list
        if (onTaskUpdate) {
          // For delete operations, pass a dummy task object to trigger refresh
          const updateData = action === 'delete' ? { id: taskId } : (result.data || result)
          onTaskUpdate(updateData)
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Failed to ${action} task:`, error)
      }
      // You might want to show a user-friendly error message here
    }
  }, [fetchTasks, onTaskUpdate])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }, [])

  const handleEditDate = useCallback((task: Task) => {
    // Open edit dialog focused on date - for now same as regular edit
    setEditingTask(task)
    setEditDialogOpen(true)
  }, [])

  const handleViewDependencies = useCallback((task: Task) => {
    setViewingTaskId(task.id)
    setDependencyViewOpen(true)
  }, [])
  
  const handleLinkTask = useCallback((task: Task) => {
    setLinkingTask(task)
    setLinkTaskDialogOpen(true)
  }, [])

  const handleSaveTask = useCallback(async (updatedTask: Task) => {
    try {
      const fullUrl = `${API_BASE_URL}/api/tasks/${updatedTask.id}`;
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      })

      if (response.ok) {
        fetchTasks() // Refresh the tasks
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask)
        }
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to update task')
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('Error updating task:', e)
      }
    }
  }, [fetchTasks, onTaskUpdate])

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false)
    setEditingTask(null)
  }, [])

  const handleCloseDependencyView = useCallback(() => {
    setDependencyViewOpen(false)
    setViewingTaskId(null)
  }, [])
  
  const handleCloseLinkTaskDialog = useCallback(() => {
    setLinkTaskDialogOpen(false)
    setLinkingTask(null)
  }, [])
  
  const handleSaveDependencies = useCallback(async (taskId: string, dependencies: string[]) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedTask = { ...task, depends: dependencies };
      
      const fullUrl = `${API_BASE_URL}/api/tasks/${taskId}`;
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });

      if (response.ok) {
        fetchTasks();
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to update task dependencies');
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('Error updating task dependencies:', e);
      }
    }
  }, [tasks, fetchTasks, onTaskUpdate])

  // Memoize filtered tasks to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Project filter
      if (projectFilter && task.project !== projectFilter) {
        return false;
      }

      // Assignee filter (already applied in server endpoint, but also check quick filter)
      if (assigneeFilter && task.assignee !== assigneeFilter) {
        return false;
      }

      // Due date filter
      if (dueDateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() + 1);

        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          switch (dueDateFilter) {
            case 'today':
              return dueDate.getTime() === today.getTime();
            case 'tomorrow':
              return dueDate.getTime() === tomorrow.getTime();
            case 'this-week':
              return dueDate >= today && dueDate < nextWeek;
            case 'next-week':
              const nextWeekStart = new Date(nextWeek);
              const nextWeekEnd = new Date(nextWeek);
              nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
              return dueDate >= nextWeekStart && dueDate < nextWeekEnd;
            case 'this-month':
              return dueDate >= today && dueDate < thisMonth;
            case 'overdue':
              return dueDate < today;
            default:
              return true;
          }
        } else {
          // Tasks without due dates are excluded from date-specific filters (except 'all')
          return dueDateFilter === '';
        }
      }

      return true;
    });
  }, [tasks, projectFilter, assigneeFilter, dueDateFilter]);

  // Memoize individual task action handlers to prevent unnecessary re-renders
  const memoizedTaskHandlers = useMemo(() => ({
    onMarkDone: (task: Task) => handleTaskAction(task.id, 'done'),
    onUnmarkDone: (task: Task) => handleTaskAction(task.id, 'undone'),
    onDelete: (task: Task) => handleTaskAction(task.id, 'delete'),
    onStop: (task: Task) => handleTaskAction(task.id, 'stop'),
  }), [handleTaskAction]);

  if (loading) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(0,0,0,0) 100%)',
        borderRadius: 2,
        border: '1px solid rgba(25,118,210,0.1)'
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Loading tasks...
        </Typography>
        <LinearProgress sx={{ 
          borderRadius: 1,
          height: 6,
          '& .MuiLinearProgress-bar': {
            borderRadius: 1
          }
        }} />
      </Box>
    )
  }

  if (filteredTasks.length === 0) {
    const hasActiveFilters = assigneeFilter || projectFilter || dueDateFilter;
    
    return (
      <Box 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)',
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1, zIndex: 2, position: 'relative' }}>
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ zIndex: 2, position: 'relative' }}>
          {hasActiveFilters
            ? `No ${filter} tasks found matching your current filters`
            : `No ${filter} tasks found. Create a new task to get started!`
          }
        </Typography>
      </Box>
    )
  }

  return (
    <Box 
      sx={{ 
        '& > *:not(:last-child)': { 
          marginBottom: 1.5 
        },
        position: 'relative',
        zIndex: 1
      }}
    >
      {filteredTasks.map((task) => (
        <Box key={task.id}>
          <TaskCard
            task={task}
            onViewDependencies={handleViewDependencies}
            onMarkDone={memoizedTaskHandlers.onMarkDone}
            onUnmarkDone={memoizedTaskHandlers.onUnmarkDone}
            onDelete={memoizedTaskHandlers.onDelete}
            onStop={memoizedTaskHandlers.onStop}
            onEdit={handleEditTask}
            onEditDate={handleEditDate}
            onLinkTask={handleLinkTask}
            compact={false}
          />
        </Box>
      ))}

      <TaskEditDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        task={editingTask}
        onSave={handleSaveTask}
      />

      <Dialog
        open={dependencyViewOpen}
        onClose={handleCloseDependencyView}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Task Dependencies</DialogTitle>
        <DialogContent>
          {viewingTaskId && <TaskDependencyView taskId={viewingTaskId} />}
        </DialogContent>
      </Dialog>
      
      <LinkTaskDialog
        open={linkTaskDialogOpen}
        task={linkingTask}
        onClose={handleCloseLinkTaskDialog}
        onSave={handleSaveDependencies}
      />
    </Box>
  )
});

// Set display name for debugging
TaskList.displayName = 'TaskList';

export default TaskList
