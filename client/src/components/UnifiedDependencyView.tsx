import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountTree as DependencyIcon,
  Task as TaskIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { TaskDTO } from '../types';
import TaskEditDialog from './TaskEditDialog';
import UnifiedTaskGraph from './UnifiedTaskGraph';
import { formatTaskDate, toSentenceCase } from '../utils/taskUtils';
import PriorityDisplay from './PriorityDisplay';

interface UnifiedDependencyViewProps {
  open: boolean;
  onClose: () => void;
}

const UnifiedDependencyView: React.FC<UnifiedDependencyViewProps> = ({ open, onClose }) => {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAllTasks();
    }
  }, [open]);

  const fetchAllTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch open statuses (pending, started)
      const response = await fetch('/api/tasks?status=pending&status=started');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const result = await response.json();
      const list = Array.isArray(result) ? result : (result.data || []);
      setTasks(list);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask: TaskDTO) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleNewTask = (newTask: TaskDTO) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTaskById = (taskId: string): TaskDTO | undefined => {
    return tasks.find(task => task.id === taskId);
  };

  const getTasksWithDependencies = () => {
    return tasks.filter(task => task.depends && task.depends.length > 0);
  };

  const getTasksDependingOn = (taskId: string) => {
    return tasks.filter(task => task.depends && task.depends.includes(taskId));
  };

  const renderTaskCard = (task: TaskDTO, isDependent = false) => (
    <Card 
      key={task.id} 
      variant="outlined" 
      sx={{ 
        mb: 1, 
        opacity: task.status === 'COMPLETED' ? 0.7 : 1,
        backgroundColor: isDependent ? 'action.hover' : 'background.paper'
      }}
    >
      <CardHeader
        avatar={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon color="primary" />
            {task.priority && (
              <PriorityDisplay 
                priority={task.priority}
                variant="chip"
                size="small"
              />
            )}
          </Box>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {task.title}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {(() => {
              const theme: any = (globalThis as any).muiTheme || undefined;
              const statusKey = task.status as keyof any;
              const style = theme?.semanticStyles?.status[statusKey] || theme?.semanticStyles?.status.PENDING;
              return (
                <Chip
                  label={task.status.toUpperCase()}
                  size="small"
                  sx={{ fontSize: '0.65rem', ...(style ? { background: style.gradient, border: `1px solid ${style.border}`, color: style.color } : {}) }}
                />
              );
            })()}
            {task.assignee && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {toSentenceCase(task.assignee)}
                </Typography>
              </Box>
            )}
            {task.dueDate && (
              <Typography variant="caption" color="text.secondary">
                Due: {formatTaskDate(task.dueDate)}
              </Typography>
            )}
          </Box>
        }
        action={
          <IconButton
            onClick={() => setEditingTask(task)}
            size="small"
            aria-label="edit task"
          >
            <TaskIcon />
          </IconButton>
        }
      />
      {task.description && (
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {task.description}
          </Typography>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const tasksWithDependencies = getTasksWithDependencies();

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DependencyIcon />
              <Typography variant="h6">Unified Dependency View</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setShowGraph(!showGraph)}
                startIcon={<DependencyIcon />}
              >
                {showGraph ? 'Hide Graph' : 'Show Graph'}
              </Button>
              <Button
                variant="contained"
                onClick={() => setNewTaskDialogOpen(true)}
                startIcon={<AddIcon />}
              >
                Add Task
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {showGraph && (
            <Box sx={{ mb: 3 }}>
              <UnifiedTaskGraph tasks={tasks} />
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Tasks with Dependencies */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Tasks with Dependencies ({tasksWithDependencies.length})
                </Typography>
                
                {tasksWithDependencies.length === 0 ? (
                  <Alert severity="info">No tasks have dependencies</Alert>
                ) : (
                  tasksWithDependencies.map((task) => (
                    <Box key={task.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleTaskExpansion(task.id)}
                        >
                          {expandedTasks.has(task.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {task.title}
                        </Typography>
                        <Chip
                          label={`${task.depends?.length || 0} deps`}
                          size="small"
                          color="warning"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      </Box>
                      
                      <Collapse in={expandedTasks.has(task.id)}>
                        <Box sx={{ ml: 4 }}>
                          {renderTaskCard(task)}
                          
                          <Typography variant="subtitle2" sx={{ fontWeight: 'medium', mt: 1, mb: 1, display: 'block' }}>
                            Depends on:
                          </Typography>
                          {task.depends?.map((depId: string) => {
                            const depTask = getTaskById(depId);
                            return depTask ? renderTaskCard(depTask, true) : (
                              <Alert key={depId} severity="warning" sx={{ mb: 1 }}>
                                Task with ID {depId} not found
                              </Alert>
                            );
                          })}
                        </Box>
                      </Collapse>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>

            {/* All Tasks */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  All Tasks ({tasks.length})
                </Typography>
                
                {tasks.map((task) => {
                  const dependentTasks = getTasksDependingOn(task.id);
                  return (
                    <Box key={task.id} sx={{ mb: 2 }}>
                      {renderTaskCard(task)}
                      
                      {dependentTasks.length > 0 && (
                        <Box sx={{ ml: 2, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {dependentTasks.length} task(s) depend on this
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  );
                })}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add New Task Dialog */}
      <TaskEditDialog
        open={newTaskDialogOpen}
        onClose={() => setNewTaskDialogOpen(false)}
        onSave={handleNewTask}
        task={null}
      />

      {/* Edit Task Dialog */}
      <TaskEditDialog
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleTaskUpdate}
        task={editingTask}
      />
    </>
  );
};

export default UnifiedDependencyView;
