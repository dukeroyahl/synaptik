import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Task } from '../types';
import TaskDependencyGraph from './TaskDependencyGraph';

interface TaskDependencyViewProps {
  taskId: string;
}

const TaskDependencyView: React.FC<TaskDependencyViewProps> = ({ taskId }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [dependencyTasks, setDependencyTasks] = useState<Task[]>([]);
  const [dependentTasks, setDependentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch the main task
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task details');
        }
        
        const taskResult = await taskResponse.json();
        setTask(taskResult.data);
        
        // Fetch dependency tasks
        if (taskResult.data.depends && taskResult.data.depends.length > 0) {
          const dependencyDetails: Task[] = [];
          
          for (const depId of taskResult.data.depends) {
            const depResponse = await fetch(`/api/tasks/${depId}`);
            if (depResponse.ok) {
              const depResult = await depResponse.json();
              dependencyDetails.push(depResult.data);
            }
          }
          
          setDependencyTasks(dependencyDetails);
        } else {
          setDependencyTasks([]);
        }
        
        // Fetch tasks that depend on this task
        const dependentResponse = await fetch(`/api/tasks?depends=${taskId}`);
        if (dependentResponse.ok) {
          const dependentResult = await dependentResponse.json();
          setDependentTasks(dependentResult.data || []);
        }
      } catch (err) {
        setError('Failed to load dependency information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [taskId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!task) {
    return <Alert severity="info">Task not found</Alert>;
  }

  const hasDependencies = dependencyTasks.length > 0;
  const hasDependents = dependentTasks.length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dependencies for: {task.title}
      </Typography>
      
      {!hasDependencies && !hasDependents ? (
        <Alert severity="info">
          This task has no dependencies or dependent tasks
        </Alert>
      ) : (
        <>
          {hasDependencies && (
            <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                This task depends on:
              </Typography>
              <List dense>
                {dependencyTasks.map((depTask, index) => (
                  <React.Fragment key={depTask.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={depTask.title}
                        secondary={
                          <span style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <Chip 
                              label={depTask.status} 
                              size="small" 
                              color={depTask.status === 'COMPLETED' ? 'success' : 'default'}
                            />
                            {depTask.priority && (
                              <Chip 
                                label={`Priority: ${depTask.priority}`} 
                                size="small" 
                                color={
                                  depTask.priority === 'HIGH' ? 'error' : 
                                  depTask.priority === 'MEDIUM' ? 'warning' : 'info'
                                }
                              />
                            )}
                          </span>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
          
          {hasDependents && (
            <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tasks that depend on this:
              </Typography>
              <List dense>
                {dependentTasks.map((depTask, index) => (
                  <React.Fragment key={depTask.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={depTask.title}
                        secondary={
                          <span style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <Chip 
                              label={depTask.status} 
                              size="small" 
                              color={depTask.status === 'COMPLETED' ? 'success' : 'default'}
                            />
                            {depTask.priority && (
                              <Chip 
                                label={`Priority: ${depTask.priority}`} 
                                size="small" 
                                color={
                                  depTask.priority === 'HIGH' ? 'error' : 
                                  depTask.priority === 'MEDIUM' ? 'warning' : 'info'
                                }
                              />
                            )}
                          </span>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
          
          {(hasDependencies || hasDependents) && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? 'Hide Visualization' : 'Show Visualization'}
              </Button>
            </Box>
          )}
          
          {showGraph && hasDependencies && (
            <TaskDependencyGraph 
              task={task} 
              dependencyTasks={dependencyTasks} 
            />
          )}
        </>
      )}
    </Box>
  );
};

export default TaskDependencyView;
