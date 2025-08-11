import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import DateTimeInput from './DateTimeInput';
import {
  formatDateWithTimezone,
  formatDateFromBackend,
  getUserTimezone,
  getCurrentDateISO,
  isValidISODate,
} from '../utils/dateUtils';

interface DateExampleDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Example dialog demonstrating ISO 8601 date handling
 * This component shows how to use the new date system
 */
const DateExampleDialog: React.FC<DateExampleDialogProps> = ({ open, onClose }) => {
  const [dateOnly, setDateOnly] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [waitUntil, setWaitUntil] = useState('');

  const userTimezone = getUserTimezone();
  const currentISO = getCurrentDateISO();

  // Example: Set some default values
  const handleSetExamples = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 30, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);

    setDateOnly(tomorrow.toISOString().split('T')[0]);
    setDateTime(tomorrow.toISOString());
    setWaitUntil(nextWeek.toISOString());
  };

  const handleClear = () => {
    setDateOnly('');
    setDateTime('');
    setWaitUntil('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>ISO 8601 Date System Example</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current System Info
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2">
              <strong>User Timezone:</strong> {userTimezone}
            </Typography>
            <Typography variant="body2">
              <strong>Current ISO:</strong> {currentISO}
            </Typography>
            <Typography variant="body2">
              <strong>Formatted:</strong> {formatDateWithTimezone(currentISO)}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Date Input Examples
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <DateTimeInput
              label="Date Only"
              value={dateOnly}
              onChange={setDateOnly}
              type="date"
              helperText="Stores as date-only format"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DateTimeInput
              label="Date & Time"
              value={dateTime}
              onChange={setDateTime}
              type="datetime"
              showTimezone={true}
              helperText="Full ISO 8601 with timezone"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DateTimeInput
              label="Wait Until"
              value={waitUntil}
              onChange={setWaitUntil}
              type="datetime"
              helperText="Task availability date"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Button variant="outlined" onClick={handleSetExamples} sx={{ mr: 1 }}>
            Set Example Values
          </Button>
          <Button variant="outlined" onClick={handleClear}>
            Clear All
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Formatted Output
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Date Only Field
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <strong>Raw Value:</strong> {dateOnly || 'empty'}
              </Typography>
              {dateOnly && (
                <>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Valid ISO:</strong> {isValidISODate(dateOnly) ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Display:</strong> {formatDateFromBackend(dateOnly, 'fullDate')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Time Remaining:</strong> {formatDateFromBackend(dateOnly, 'timeRemaining')}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Date & Time Field
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <strong>Raw Value:</strong> {dateTime || 'empty'}
              </Typography>
              {dateTime && (
                <>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Valid ISO:</strong> {isValidISODate(dateTime) ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>With Timezone:</strong> {formatDateWithTimezone(dateTime)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Display:</strong> {formatDateFromBackend(dateTime, 'fullDate')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Time Remaining:</strong> {formatDateFromBackend(dateTime, 'timeRemaining')}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Wait Until Field
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <strong>Raw Value:</strong> {waitUntil || 'empty'}
              </Typography>
              {waitUntil && (
                <>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Valid ISO:</strong> {isValidISODate(waitUntil) ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>With Timezone:</strong> {formatDateWithTimezone(waitUntil)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <strong>Display:</strong> {formatDateFromBackend(waitUntil, 'fullDate')}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> All dates are automatically converted to ISO 8601 format with timezone information.
            The backend receives these values and can handle timezone-aware operations.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateExampleDialog;
