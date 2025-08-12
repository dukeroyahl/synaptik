import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskDTO } from '../types';
import { taskService } from '../services/taskService';
import { parseBackendDate } from '../utils/dateUtils';

interface CalendarProps {
  onTaskSelect?: (taskId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onTaskSelect }) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasks = await taskService.getTasks();
      
      if (!tasks) {
        console.warn('No tasks returned from service');
        setTasks([]);
      } else {
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks for calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      setError(errorMessage);
      setTasks([]); // Clear tasks on error
    } finally {
      setLoading(false);
    }
  };
    // Get CSS class based on task priority and status
  const getTaskClass = (task: TaskDTO) => {
    if (task.status === 'COMPLETED') return 'task-completed';
    
    switch (task.priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  // Convert tasks to calendar events
  const events = tasks
    .filter(task => task.dueDate) // Only include tasks with due dates
    .map(task => {
      try {
        // Use the timezone-aware date parser
        const dueDate = parseBackendDate(task.dueDate!);
        return {
          id: task.id,
          title: task.title,
          start: dueDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
          allDay: true,
          className: getTaskClass(task),
          extendedProps: { task }
        };
      } catch (error) {
        console.error('Error parsing date for task', task.id, task.dueDate, error);
        // Fallback to original date string if parsing fails
        const fallbackDate = new Date(task.dueDate!);
        return {
          id: task.id,
          title: task.title,
          start: fallbackDate.toISOString().split('T')[0],
          allDay: true,
          className: getTaskClass(task),
          extendedProps: { task }
        };
      }
    });



  const handleEventClick = (info: any) => {
    try {
      if (onTaskSelect && info.event && info.event.id) {
        onTaskSelect(info.event.id);
      }
    } catch (error) {
      console.error('Error handling event click:', error);
    }
  };


  return (
      <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} className="custom-card">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Task Calendar
          </Typography>
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Loading tasks...
            </Typography>
          )}
          {error && (
            <Box>
              <Typography variant="body2" color="error" gutterBottom>
                Error: {error}
              </Typography>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={fetchTasks}
              >
                Click to retry
              </Typography>
            </Box>
          )}
          {!loading && !error && tasks.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No tasks found.
            </Typography>
          )}
          {!loading && !error && tasks.length > 0 && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Showing {tasks.length} tasks ({events.length} with due dates)
            </Typography>
          )}
          {!loading && !error && (
            <Box 
              sx={{ 
                height: 600, 
                '& .fc': { height: '100%' },
                '& .fc-event': {
                  borderRadius: '4px',
                  border: 'none',
                  padding: '2px 4px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                },
                '& .priority-high': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#d32f2f' : '#ff5722',
                  color: 'white',
                },
                '& .priority-medium': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#f57c00' : '#ff9800',
                  color: 'white',
                },
                '& .priority-low': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#388e3c' : '#4caf50',
                  color: 'white',
                },
                '& .task-completed': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#666' : '#9e9e9e',
                  color: 'white',
                  opacity: 0.7,
                  textDecoration: 'line-through',
                },
              }}
            >
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
                events={events}
                eventClick={handleEventClick}
                height="100%"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: false
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
  );
};

export default Calendar;
