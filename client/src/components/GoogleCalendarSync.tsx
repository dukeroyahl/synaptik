import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudSync as CloudSyncIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import googleCalendarService from '../services/googleCalendar';
import { Task } from '../types';

interface GoogleCalendarSyncProps {
  tasks: Task[];
  onSyncComplete?: () => void;
  isAuthenticated: boolean;
}

const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  tasks,
  onSyncComplete,
  isAuthenticated
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem('googleCalendarAutoSync') === 'true';
  });
  const [syncStats, setSyncStats] = useState<{
    created: number;
    updated: number;
    errors: number;
  }>({ created: 0, updated: 0, errors: 0 });

  useEffect(() => {
    localStorage.setItem('googleCalendarAutoSync', autoSync.toString());
  }, [autoSync]);

  useEffect(() => {
    if (autoSync && isAuthenticated && tasks.length > 0) {
      const timer = setTimeout(() => {
        handleSync();
      }, 2000); // Auto-sync 2 seconds after tasks change

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tasks, autoSync, isAuthenticated]);

  const convertTaskToEvent = (task: Task) => {
    const startDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    return {
      summary: task.description,
      description: `
Task: ${task.description}
${task.project ? `Project: ${task.project}` : ''}
${task.tags?.length ? `Tags: ${task.tags.join(', ')}` : ''}
Priority: ${task.priority || 'Normal'}
Status: ${task.status}

Created from Synaptik Task Manager
Task ID: ${task.id}
      `.trim(),
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      colorId: getColorIdByPriority(task.priority),
    };
  };

  const getColorIdByPriority = (priority?: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '11'; // Red
      case 'medium':
        return '5';  // Yellow
      case 'low':
        return '2';  // Green
      default:
        return '1';  // Blue
    }
  };

  const handleSync = async () => {
    if (!isAuthenticated) {
      setSyncError('Please connect to Google Calendar first');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);
      
      const stats = { created: 0, updated: 0, errors: 0 };
      
      // Get tasks that have due dates and are not completed
      const tasksToSync = tasks.filter(task => 
        task.dueDate && 
        task.status !== 'completed' &&
        new Date(task.dueDate) > new Date() // Only future tasks
      );

      // Get existing calendar events
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 3); // Sync 3 months ahead

      let existingEvents: any[] = [];
      try {
        existingEvents = await googleCalendarService.getEvents(
          timeMin.toISOString(),
          timeMax.toISOString()
        );
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to fetch existing events:', error);
        }
      }

      // Filter events created by our app
      const synaptikEvents = existingEvents.filter(event => 
        event.description?.includes('Created from Synaptik Task Manager')
      );

      for (const task of tasksToSync) {
        try {
          const eventData = convertTaskToEvent(task);
          
          // Check if event already exists for this task
          const existingEvent = synaptikEvents.find(event => 
            event.description?.includes(`Task ID: ${task.id}`)
          );

          if (existingEvent) {
            // Update existing event
            await googleCalendarService.updateEvent(existingEvent.id, eventData);
            stats.updated++;
          } else {
            // Create new event
            await googleCalendarService.createEvent(eventData);
            stats.created++;
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(`Failed to sync task ${task.id}:`, error);
          }
          stats.errors++;
        }
      }

      setSyncStats(stats);
      setLastSyncTime(new Date());
      onSyncComplete?.();

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Sync failed:', error);
      }
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Connect to Google Calendar to enable task synchronization
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudSyncIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Calendar Sync</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                size="small"
              />
            }
            label="Auto-sync"
          />
          
          <Tooltip title="Sync tasks to Google Calendar">
            <Button
              onClick={handleSync}
              startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
              variant="outlined"
              size="small"
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {syncError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {syncError}
        </Alert>
      )}

      {lastSyncTime && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Last synced: {lastSyncTime.toLocaleString()}
          </Typography>
          
          {(syncStats.created > 0 || syncStats.updated > 0 || syncStats.errors > 0) && (
            <Typography variant="body2" color="text.secondary">
              {syncStats.created} created, {syncStats.updated} updated
              {syncStats.errors > 0 && `, ${syncStats.errors} errors`}
            </Typography>
          )}
        </Box>
      )}

      <Typography variant="body2" color="text.secondary">
        {autoSync ? 'Tasks will be automatically synced when changed' : 'Use the sync button to manually sync tasks'}
      </Typography>
    </Box>
  );
};

export default GoogleCalendarSync;
