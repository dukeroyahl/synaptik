import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  LinearProgress,
  useTheme
} from '@mui/material'
import { TaskDTO } from '../types'
import TaskEditDialog from './TaskEditDialog'
import TaskCard from './TaskCard'
import LinkTaskDialog from './LinkTaskDialog'
import { parseBackendDate } from '../utils/dateUtils'
import { API_BASE_URL } from '../config'
import { useFilterStore } from '../stores/filterStore'

interface TaskListProps {
  filter?: 'PENDING' | 'ACTIVE' | 'overdue' | 'today' | 'COMPLETED' | 'all'
  onTaskUpdate?: (task: TaskDTO) => void
  assigneeFilter?: string // legacy (will be ignored if store provides assignees)
  projectFilter?: string  // legacy
  dueDateFilter?: string  // legacy
}

const TaskList: React.FC<TaskListProps> = memo(({ 
  filter = 'PENDING', 
  onTaskUpdate, 
  assigneeFilter = '',
  projectFilter = '',
  dueDateFilter = ''
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [linkTaskDialogOpen, setLinkTaskDialogOpen] = useState(false)
  const [linkingTask, setLinkingTask] = useState<TaskDTO | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const storeFilters = useFilterStore(s => ({
    status: s.status,
    priorities: s.priorities,
    assignees: s.assignees,
    projects: s.projects,
    search: s.search,
    dueDate: s.dueDate,
    overviewMode: s.overviewMode,
  }));

  // Derive effective filters (store overrides legacy props if set)
  const effectiveAssignees = storeFilters.assignees.size ? storeFilters.assignees : (assigneeFilter ? new Set([assigneeFilter]) : new Set<string>());
  const effectiveProjects = storeFilters.projects.size ? storeFilters.projects : (projectFilter ? new Set([projectFilter]) : new Set<string>());
  const effectiveDueDate = storeFilters.dueDate || dueDateFilter || '';

  const querySignature = useMemo(() => (
    [
      filter,
      Array.from(storeFilters.priorities).join(','),
      Array.from(effectiveAssignees).join(','),
      Array.from(effectiveProjects).join(','),
      storeFilters.search,
      effectiveDueDate,
    ].join('|')
  ), [filter, storeFilters.priorities, effectiveAssignees, effectiveProjects, storeFilters.search, effectiveDueDate]);

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const effectiveAssigneesArr = Array.from(effectiveAssignees);
      let endpoint = '/api/tasks';
      const dueIsSpecial = effectiveDueDate === 'today' || effectiveDueDate === 'overdue';
      
      // Check if we have special filters that require getting all tasks
      const hasNoAssigneeFilter = effectiveAssignees.has('(No Assignee)');
      const hasNoProjectFilter = effectiveProjects.has('(No Project)');
      const needsAllTasks = hasNoAssigneeFilter || hasNoProjectFilter || storeFilters.overviewMode;
      
      // If due date special and a specific status (other than all) is chosen we will still hit the special endpoint for broader set then intersect client-side
      if (dueIsSpecial) {
        endpoint = effectiveDueDate === 'today' ? '/api/tasks/today' : '/api/tasks/overdue';
      } else if (needsAllTasks) {
        // When using special filters or overview mode, always get all tasks to apply client-side filtering
        endpoint = '/api/tasks';
      } else {
        switch (filter.toUpperCase()) {
          case 'PENDING': endpoint = '/api/tasks/pending'; break;
          case 'ACTIVE': endpoint = '/api/tasks/active'; break;
          case 'OVERDUE': endpoint = '/api/tasks/overdue'; break; // legacy direct selection
          case 'COMPLETED': endpoint = '/api/tasks/completed'; break;
          default: endpoint = '/api/tasks';
        }
      }
      const params = new URLSearchParams();
      if (['/api/tasks/overdue','/api/tasks/today'].includes(endpoint)) {
        try { params.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* ignore tz detection errors */ }
      }
      if (storeFilters.search) params.set('search', storeFilters.search);
      if (storeFilters.priorities.size) params.set('priority', Array.from(storeFilters.priorities).join(','));
      
      // Handle assignee filters - exclude special "(No Assignee)" from server params
      if (effectiveAssignees.size) {
        const serverAssignees = effectiveAssigneesArr.filter(a => a !== '(No Assignee)');
        if (serverAssignees.length > 0) {
          params.set('assignee', serverAssignees.join(','));
        }
      }
      
      // Handle project filters - exclude special "(No Project)" from server params
      if (effectiveProjects.size) {
        const serverProjects = Array.from(effectiveProjects).filter(p => p !== '(No Project)');
        if (serverProjects.length > 0) {
          params.set('project', serverProjects.join(','));
        }
      }
      if (!dueIsSpecial && effectiveDueDate && !['overdue','today'].includes(effectiveDueDate)) params.set('dueDate', effectiveDueDate);
      const fullUrl = `${API_BASE_URL}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(fullUrl);
      const result = await response.json();
      if (response.ok) {
        let list: Task[] = Array.isArray(result) ? result : [];
        // If combining today/overdue with a specific status subset, filter client side
        if (dueIsSpecial) {
          switch (filter.toUpperCase()) {
            case 'PENDING': list = list.filter(t => t.status === 'PENDING'); break;
            case 'ACTIVE': list = list.filter(t => t.status === 'ACTIVE'); break;
            case 'COMPLETED': list = list.filter(t => t.status === 'COMPLETED'); break;
            default: break; // all or legacy
          }
        }
        
        // If we fetched all tasks due to special filters but user has specific status, filter client side
        if (needsAllTasks && filter !== 'all' && !storeFilters.overviewMode) {
          switch (filter.toUpperCase()) {
            case 'PENDING': list = list.filter(t => t.status === 'PENDING'); break;
            case 'ACTIVE': list = list.filter(t => t.status === 'ACTIVE'); break;
            case 'COMPLETED': list = list.filter(t => t.status === 'COMPLETED'); break;
            case 'OVERDUE': 
              // Keep existing overdue logic or implement if needed
              break;
            default: break; // all or legacy
          }
        }
        
        // Apply overview mode filtering - this takes precedence over regular status filtering
        if (storeFilters.overviewMode) {
          if (storeFilters.overviewMode === 'open') {
            list = list.filter(t => t.status === 'PENDING' || t.status === 'ACTIVE');
          } else if (storeFilters.overviewMode === 'closed') {
            list = list.filter(t => t.status === 'COMPLETED');
          }
        }
        
        setTasks(list);
        useFilterStore.getState().setCountsFromTasks(list);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, querySignature, effectiveDueDate])

  const handleTaskAction = useCallback(async (taskId: string, action: 'done' | 'delete' | 'start' | 'pause' | 'undone') => {
    try {
      const originalTasks = tasks;
      const targetTask = tasks.find(t => t.id === taskId) || null;
      // Optimistic local mutation snapshot
      let updatedTasks = [...tasks];
      // Apply optimistic diff
      if (action === 'delete') {
        if (targetTask) {
          updatedTasks = updatedTasks.filter(t => t.id !== taskId);
          useFilterStore.getState().decrementCountsForTask(targetTask);
        }
      } else if (targetTask) {
        const idx = updatedTasks.findIndex(t => t.id === taskId);
        const patched = { ...targetTask } as any;
        if (action === 'done') patched.status = 'COMPLETED';
        if (action === 'undone') patched.status = 'PENDING';
        if (action === 'start') patched.status = 'ACTIVE';
        if (action === 'pause') patched.status = 'PENDING';
        updatedTasks[idx] = patched;
      }
      setTasks(updatedTasks);

      let endpoint = `/api/tasks/${taskId}`
      let method = 'POST'
      if (action === 'delete') {
        endpoint = `/api/tasks/${taskId}`
        method = 'DELETE'
      } else {
        // Map client actions to backend action endpoints
        const apiAction = action === 'pause' ? 'stop' : action;
        endpoint = `/api/tasks/${taskId}/${apiAction}`;
      }
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(fullUrl, { method, headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) {
        // Revert on failure
        setTasks(originalTasks);
        // Rebuild counts from original
        useFilterStore.getState().setCountsFromTasks(originalTasks);
        throw new Error(`HTTP ${response.status}`)
      }
      // On success reconcile with server if mutated (non-delete)
      if (action !== 'delete') {
        const data = await response.json();
        if (data) {
          // Merge updated task
            setTasks(prev => prev.map(t => t.id === taskId ? { ...(data.data || data) } : t));
            useFilterStore.getState().setCountsFromTasks(useFilterStore.getState().assigneeCounts ? updatedTasks : updatedTasks);
        }
      }
      // Refresh counts after final state
      useFilterStore.getState().setCountsFromTasks(updatedTasks);
      if (onTaskUpdate) onTaskUpdate({ id: taskId } as Task);
    } catch (error) {
      if (import.meta.env.DEV) console.error(`Failed to ${action} task:`, error)
    }
  }, [tasks, onTaskUpdate])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }, [])

  const handleEditDate = useCallback((task: Task) => {
    // Open edit dialog focused on date - for now same as regular edit
    setEditingTask(task)
    setEditDialogOpen(true)
  }, [])
  
  // Suppress unused variable warning - keeping for future use
  void handleEditDate;

  const handleViewDependencies = useCallback((task: Task) => {
    navigate(`/dependencies?task=${task.id}`);
  }, [navigate]);
  
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
      // Client-side supplemental filtering (mirrors params to be safe)
      if (effectiveProjects.size) {
        const hasNoProjectFilter = effectiveProjects.has('(No Project)');
        const taskHasNoProject = !task.projectName;
        const taskProjectMatches = task.projectName && effectiveProjects.has(task.projectName);
        
        // Task must match at least one project filter condition
        const matchesProjectFilter = (hasNoProjectFilter && taskHasNoProject) || taskProjectMatches;
        if (!matchesProjectFilter) return false;
      }
      
      if (effectiveAssignees.size) {
        const hasNoAssigneeFilter = effectiveAssignees.has('(No Assignee)');
        const taskHasNoAssignee = !task.assignee;
        const taskAssigneeMatches = task.assignee && effectiveAssignees.has(task.assignee);
        
        // Task must match at least one assignee filter condition
        const matchesAssigneeFilter = (hasNoAssigneeFilter && taskHasNoAssignee) || taskAssigneeMatches;
        if (!matchesAssigneeFilter) return false;
      }
      if (storeFilters.priorities.size && (!task.priority || !storeFilters.priorities.has(task.priority))) return false;
      if (storeFilters.search) {
        const q = storeFilters.search.toLowerCase();
        if (!(task.title?.toLowerCase().includes(q) || 
              task.description?.toLowerCase().includes(q) || 
              task.assignee?.toLowerCase().includes(q))) return false;
      }
      // Due date (reuse existing logic)
      if (effectiveDueDate) {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
        const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate()+7);
        const thisMonth = new Date(today); thisMonth.setMonth(thisMonth.getMonth()+1);
        if (task.dueDate) {
          const due = parseBackendDate(task.dueDate); due.setHours(0,0,0,0);
          switch (effectiveDueDate) {
            case 'today': if (due.getTime() !== today.getTime()) return false; break;
            case 'tomorrow': if (due.getTime() !== tomorrow.getTime()) return false; break;
            case 'this-week': if (!(due >= today && due < nextWeek)) return false; break;
            case 'next-week': {
              const start = nextWeek; const end = new Date(nextWeek); end.setDate(end.getDate()+7);
              if (!(due >= start && due < end)) return false; break;
            }
            case 'this-month': if (!(due >= today && due < thisMonth)) return false; break;
            case 'overdue': if (!(due < today)) return false; break;
          }
        } else if (effectiveDueDate) return false;
      }
      return true;
    });
  }, [tasks, effectiveProjects, effectiveAssignees, storeFilters.priorities, storeFilters.search, effectiveDueDate]);

  // Memoize individual task action handlers to prevent unnecessary re-renders
  const memoizedTaskHandlers = useMemo(() => ({
    onMarkDone: (task: Task) => handleTaskAction(task.id, 'done'),
    onUnmarkDone: (task: Task) => handleTaskAction(task.id, 'undone'),
    onDelete: (task: Task) => handleTaskAction(task.id, 'delete'),
    onPause: (task: Task) => handleTaskAction(task.id, 'pause'),
    onStart: (task: Task) => handleTaskAction(task.id, 'start'),
  }), [handleTaskAction]);

  if (loading) {
    return (
      <Box sx={{ 
        p: theme.spacing(3), 
        textAlign: 'center',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, transparent 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main}14 0%, transparent 100%)`,
        borderRadius: theme.ds?.radii.md,
        border: `1px solid ${theme.palette.divider}`
      }} aria-busy="true" aria-live="polite">
        <Typography variant="h6" sx={{ mb: theme.spacing(2), color: 'primary.main' }}>
          Loading tasks...
        </Typography>
        <LinearProgress sx={{ 
          borderRadius: theme.ds?.radii.xs,
          height: 6,
          '& .MuiLinearProgress-bar': {
            borderRadius: theme.ds?.radii.xs
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
          p: theme.spacing(4), 
          textAlign: 'center',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 100%)`
            : `linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 100%)`,
          borderRadius: theme.ds?.radii.md,
          border: `1px solid ${theme.palette.divider}`,
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: theme.spacing(1) }}>
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
          marginBottom: theme.spacing(1.5) 
        }
      }}
    >
      {filteredTasks.map((task) => (
        <Box key={task.id}>
          <TaskCard
            task={task}
            selected={task.id === selectedTaskId}
            onSelect={() => setSelectedTaskId(prev => prev === task.id ? null : task.id)}
            onViewDependencies={handleViewDependencies}
            onMarkDone={memoizedTaskHandlers.onMarkDone}
            onUnmarkDone={memoizedTaskHandlers.onUnmarkDone}
            onDelete={memoizedTaskHandlers.onDelete}
            onPause={memoizedTaskHandlers.onPause}
            onStart={memoizedTaskHandlers.onStart}
            onEdit={handleEditTask}
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
