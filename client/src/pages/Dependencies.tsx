import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  AccountTree as DependencyIcon,
  Task as TaskIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { TaskDTO } from '../types';
import UnifiedTaskGraph from '../components/UnifiedTaskGraph';
import TaskList from '../components/TaskList';
import TaskCapture from '../components/TaskCapture';
import { taskService } from '../services/taskService';
import { useFilterStore } from '../stores/filterStore';

const Dependencies: React.FC = () => {
  const theme = useTheme();
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use filter store for search
  const search = useFilterStore(s => s.search);
  const setSearch = useFilterStore(s => s.setSearch);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks = await taskService.getTasks();
      setAllTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskCaptured = () => {
    fetchTasks();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 0.5, pb: 2, px: 2, maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <DependencyIcon />
          Task Dependencies
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Force-Directed Graph - Full page width */}
      <Box sx={{ 
        justifyContent: 'center',
        width: '93vw',
        maxWidth: '95vw',
        mb: 2,
      }}>
        <UnifiedTaskGraph
          tasks={allTasks}
        />
      </Box>

      {/* Task Management Section */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Quick Task Capture */}
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <Card elevation={theme.palette.mode === 'dark' ? 3 : 1} sx={{ p: 1 }} className="glass-task-container">
            <TaskCapture onTaskCaptured={handleTaskCaptured} />
          </Card>
        </Box>

        {/* Search and Task List */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskIcon />
                  All Tasks
                </Typography>
                
                {/* Search Box */}
                <TextField
                  size="small"
                  placeholder="Search by name or assignee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <ClearIcon 
                          sx={{ 
                            color: 'text.secondary', 
                            fontSize: 16, 
                            cursor: 'pointer',
                            '&:hover': { color: 'text.primary' }
                          }} 
                          onClick={() => setSearch('')}
                        />
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    minWidth: 220,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'background.paper',
                      }
                    }
                  }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {search 
                  ? `Search active: "${search}" - Use "View Dependencies" to see specific relationships.`
                  : `Showing all tasks. Use "View Dependencies" to see specific relationships.`
                }
              </Typography>
              
              {/* Task List with search applied via store */}
              <TaskList
                filter="all"
                onTaskUpdate={fetchTasks}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dependencies;
