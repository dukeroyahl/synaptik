import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon
} from '@mui/icons-material';
import { TaskDTO } from '../types';

interface TaskDependencySelectorProps {
  taskId: string;
  dependencies: string[];
  onChange: (dependencies: string[]) => void;
}

const TaskDependencySelector: React.FC<TaskDependencySelectorProps> = ({
  taskId,
  dependencies,
  onChange
}) => {
  const [availableTasks, setAvailableTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(dependencies || []);

  useEffect(() => {
    fetchAvailableTasks();
  }, [taskId]);

  const fetchAvailableTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Limit to non-completed tasks to reduce noise
      const response = await fetch('/api/tasks?status=pending&status=started');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Request failed');
      }

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      if (!Array.isArray(list)) {
        throw new Error('Unexpected tasks response shape');
      }

      // Filter out the current task and any completed just in case
      const filteredTasks = list.filter((task: TaskDTO) =>
        task && task.id !== taskId && task.status !== 'COMPLETED'
      );
      setAvailableTasks(filteredTasks);
    } catch (err: any) {
      console.error('Failed to fetch available tasks:', err);
      setError(err.message || 'Failed to load tasks');
      setAvailableTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const newSelectedTasks = selectedTasks.includes(taskId)
      ? selectedTasks.filter(id => id !== taskId)
      : [...selectedTasks, taskId];
    
    setSelectedTasks(newSelectedTasks);
    onChange(newSelectedTasks);
  };

  const filteredTasks = availableTasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower)) ||
      (task.projectName && task.projectName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Link this task to depend on other tasks
      </Typography>
      
      <TextField
        fullWidth
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        margin="normal"
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <Paper variant="outlined" sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" variant="body2">{error}</Typography>
            <Button onClick={fetchAvailableTasks} size="small" sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No tasks found
            </Typography>
          </Box>
        ) : (
          <List dense>
            {filteredTasks.map((task) => (
              <React.Fragment key={task.id}>
                <ListItem
                  button
                  onClick={() => handleToggleTask(task.id)}
                  selected={selectedTasks.includes(task.id)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedTasks.includes(task.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="medium">
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {task.assignee && (
                          <Typography variant="caption" color="text.secondary">
                            Owner: {task.assignee}
                          </Typography>
                        )}
                        {task.projectName && (
                          <Typography variant="caption" color="text.secondary">
                            Project: {task.projectName}
                          </Typography>
                        )}
                        {task.dueDate && (
                          <Typography variant="caption" color="text.secondary">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>
    </Box>
  );
};

export default TaskDependencySelector;
