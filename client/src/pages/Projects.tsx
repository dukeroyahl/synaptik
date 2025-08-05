import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { Task } from '../types';
import { taskService } from '../services/taskService';
import ProjectView from '../components/ProjectView';
import TaskEditDialog from '../components/TaskEditDialog';
import TaskDependencyView from '../components/TaskDependencyView';

const Projects: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dependencyTaskId, setDependencyTaskId] = useState<string | null>(null);
  const [dependencyViewOpen, setDependencyViewOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskService.getTasks();
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { ...task, status: 'COMPLETED' });
      await fetchTasks();
    } catch (error) {
      console.error('Error marking task as done:', error);
    }
  };

  const handleUnmarkDone = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { ...task, status: 'PENDING' });
      await fetchTasks();
    } catch (error) {
      console.error('Error unmarking task as done:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleEditDate = (task: Task) => {
    // Open edit dialog focused on date - for now same as regular edit
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    try {
      await taskService.updateTask(updatedTask.id, updatedTask);
      setEditDialogOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await taskService.deleteTask(task.id);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleViewDependencies = (task: Task) => {
    setDependencyTaskId(task.id);
    setDependencyViewOpen(true);
  };

  const handleStop = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { ...task, status: 'PENDING' });
      await fetchTasks();
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading projects...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ProjectView
        tasks={tasks}
        onMarkDone={handleMarkDone}
        onUnmarkDone={handleUnmarkDone}
        onEdit={handleEdit}
        onEditDate={handleEditDate}
        onDelete={handleDelete}
        onViewDependencies={handleViewDependencies}
        onStop={handleStop}
      />

      {/* Edit Dialog */}
      <TaskEditDialog
        task={editingTask}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Dependency View Dialog */}
      {dependencyTaskId && (
        <TaskDependencyView
          taskId={dependencyTaskId}
        />
      )}
      
      {dependencyViewOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
          onClick={() => {
            setDependencyViewOpen(false);
            setDependencyTaskId(null);
          }}
        >
          <Box
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 2
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {dependencyTaskId && <TaskDependencyView taskId={dependencyTaskId} />}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                onClick={() => {
                  setDependencyViewOpen(false);
                  setDependencyTaskId(null);
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Projects;
