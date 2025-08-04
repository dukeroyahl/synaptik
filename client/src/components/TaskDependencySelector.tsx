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
  Search as SearchIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { Task } from '../types';
import { generateTaskId } from '../utils/taskUtils';

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
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(dependencies || []);

  useEffect(() => {
    fetchAvailableTasks();
  }, [taskId]);

  const fetchAvailableTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      
      if (response.ok) {
        // Filter out the current task and completed tasks
        const filteredTasks = result.data.filter((task: Task) => 
          task.id !== taskId && task.status !== 'COMPLETED'
        );
        setAvailableTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Failed to fetch available tasks:', error);
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
      (task.project && task.project.toLowerCase().includes(searchLower))
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {generateTaskId(task)}
                        </Typography>
                        <Typography variant="body2">
                          {task.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {task.project && (
                          <Typography variant="caption" color="text.secondary">
                            Project: {task.project.toUpperCase()}
                          </Typography>
                        )}
                        {task.priority && (
                          <Typography variant="caption" color="text.secondary">
                            Priority: {task.priority}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
        </Typography>
        
        <Button 
          startIcon={<LinkIcon />}
          variant="outlined"
          size="small"
          disabled={selectedTasks.length === 0}
          onClick={() => onChange(selectedTasks)}
        >
          Link Selected Tasks
        </Button>
      </Box>
    </Box>
  );
};

export default TaskDependencySelector;
