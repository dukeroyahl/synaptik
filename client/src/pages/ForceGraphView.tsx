import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Slider,
  Divider
} from '@mui/material';
import {
  BubbleChart as ForceIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { TaskDTO } from '../types';
import ForceDirectedTaskGraph from '../components/ForceDirectedTaskGraph';
import { taskService } from '../services/taskService';

const ForceGraphView: React.FC = () => {
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [graphSettings, setGraphSettings] = useState({
    width: Math.min(1200, window.innerWidth * 0.9),
    height: Math.min(800, window.innerHeight * 0.7),
    showOnlyConnected: false
  });

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

  // Filter tasks based on settings
  const filteredTasks = React.useMemo(() => {
    if (!graphSettings.showOnlyConnected) {
      return allTasks;
    }
    
    // Only show tasks that have dependencies or dependents
    return allTasks.filter(task => {
      const hasDependencies = task.depends && task.depends.length > 0;
      const hasDependents = allTasks.some(t => t.depends && t.depends.includes(task.id));
      return hasDependencies || hasDependents;
    });
  }, [allTasks, graphSettings.showOnlyConnected]);

  const handleSettingChange = (setting: keyof typeof graphSettings, value: any) => {
    setGraphSettings(prev => ({
      ...prev,
      [setting]: value
    }));
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
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <ForceIcon />
          Force Directed Task Graph
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Interactive visualization of task relationships with project clustering
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Settings Panel */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showSettings ? 2 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon fontSize="small" />
              <Typography variant="subtitle2">Graph Settings</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={showSettings}
                  onChange={(e) => setShowSettings(e.target.checked)}
                  size="small"
                />
              }
              label="Show Settings"
            />
          </Box>
          
          {showSettings && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" gutterBottom>
                    Graph Width: {graphSettings.width}px
                  </Typography>
                  <Slider
                    value={graphSettings.width}
                    onChange={(_, value) => handleSettingChange('width', value)}
                    min={600}
                    max={1600}
                    step={50}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" gutterBottom>
                    Graph Height: {graphSettings.height}px
                  </Typography>
                  <Slider
                    value={graphSettings.height}
                    onChange={(_, value) => handleSettingChange('height', value)}
                    min={400}
                    max={1000}
                    step={50}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ minWidth: 200 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={graphSettings.showOnlyConnected}
                        onChange={(e) => handleSettingChange('showOnlyConnected', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show only connected tasks"
                  />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {filteredTasks.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tasks Shown
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" color="secondary">
              {new Set(filteredTasks.map(t => t.projectName).filter(Boolean)).size}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Projects
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 150 }}>
          <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {filteredTasks.filter(t => t.depends && t.depends.length > 0).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              With Dependencies
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Force Directed Graph */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        mb: 2,
      }}>
        <Box sx={{ width: '98%' }}>
          <ForceDirectedTaskGraph
            tasks={filteredTasks}
            width={graphSettings.width}
            height={graphSettings.height}
          />
        </Box>
      </Box>

      {/* Legend */}
      <Card>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <Box>
              <strong>Node Size:</strong> Based on dependency count
            </Box>
            <Box>
              <strong>Node Color:</strong> Project (when clustered) or Status
            </Box>
            <Box>
              <strong>Border Thickness:</strong> Priority level
            </Box>
            <Box>
              <strong>Arrows:</strong> Dependency direction
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForceGraphView;
