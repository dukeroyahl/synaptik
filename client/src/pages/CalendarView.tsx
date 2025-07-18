import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid } from '@mui/material';
import Calendar from '../components/Calendar';
import { Task } from '../types';

const CalendarView: React.FC = () => {
  const [taskDetails, setTaskDetails] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Calendar view now focuses only on local task display
  }, []);

  const handleTaskSelect = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const result = await response.json();
        setTaskDetails(result.data);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No date set';
    return new Date(dateStr).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Task Calendar
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        View your tasks by due date
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Calendar onTaskSelect={handleTaskSelect} />
        </Grid>
      </Grid>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {taskDetails && (
          <>
            <DialogTitle>
              {taskDetails.title}
            </DialogTitle>
            <DialogContent dividers>
              {taskDetails.description && (
                <Typography variant="body1" paragraph>
                  {taskDetails.description}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Status:</strong> {taskDetails.status}
              </Typography>
              <Typography variant="body2">
                <strong>Priority:</strong> {taskDetails.priority || 'None'}
              </Typography>
              {taskDetails.project && (
                <Typography variant="body2">
                  <strong>Project:</strong> {taskDetails.project}
                </Typography>
              )}
              {taskDetails.dueDate && (
                <Typography variant="body2">
                  <strong>Due Date:</strong> {formatDate(taskDetails.dueDate)}
                </Typography>
              )}
              {taskDetails.tags && taskDetails.tags.length > 0 && (
                <Typography variant="body2">
                  <strong>Tags:</strong> {taskDetails.tags.join(', ')}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CalendarView;
