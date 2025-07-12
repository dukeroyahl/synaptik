import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '../types';

interface CalendarProps {
  onTaskSelect?: (taskId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onTaskSelect }) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Calendar useEffect triggered');
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    console.log('fetchTasks called');
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      console.log('API response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Tasks received:', result.data?.length || 0, result.data);
        setTasks(result.data || []);
        setError(null);
      } else {
        console.error('API response not ok:', response.status);
        setError('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Failed to fetch tasks for calendar:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
      console.log('fetchTasks completed, loading set to false');
    }
  };
    // Get CSS class based on task priority and status
  const getTaskClass = (task: Task) => {
    if (task.status === 'completed') return 'task-completed';
    
    switch (task.priority) {
      case 'H': return 'priority-high';
      case 'M': return 'priority-medium';
      case 'L': return 'priority-low';
      default: return '';
    }
  };

  // Convert tasks to calendar events
  const events = tasks
    .filter(task => task.dueDate) // Only include tasks with due dates
    .map(task => {
      // Parse the date to ensure it's in the right format
      const dueDate = new Date(task.dueDate!);
      return {
        id: task.id,
        title: task.title,
        start: dueDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        allDay: true,
        className: getTaskClass(task),
        extendedProps: { task }
      };
    });



  const handleEventClick = (info: any) => {
    if (onTaskSelect) {
      onTaskSelect(info.event.id);
    }
  };

  console.log('Calendar render - loading:', loading, 'error:', error, 'tasks:', tasks.length, 'events:', events.length);

  return (
    <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} className="custom-card">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Task Calendar ({tasks.length} tasks, {events.length} events)
        </Typography>
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading tasks...
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            Error: {error}
          </Typography>
        )}
        {!loading && !error && tasks.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No tasks found.
          </Typography>
        )}
        {!loading && !error && (
          <Box sx={{ height: 600, '& .fc': { height: '100%' } }}>
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
