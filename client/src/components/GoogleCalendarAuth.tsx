import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import {
  Google as GoogleIcon,
  CheckCircle as CheckIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import googleCalendarService from '../services/googleCalendar';

interface GoogleCalendarAuthProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const GoogleCalendarAuth: React.FC<GoogleCalendarAuthProps> = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setIsInitializing(true);
      await googleCalendarService.initialize();
      setIsAuthenticated(googleCalendarService.isAuthenticated);
      setError(null);
    } catch (error) {
      console.error('Failed to initialize Google Calendar service:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize Google Calendar');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await googleCalendarService.authenticate();
      setIsAuthenticated(success);
      
      if (success) {
        onAuthChange?.(true);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    try {
      googleCalendarService.signOut();
      setIsAuthenticated(false);
      onAuthChange?.(false);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    }
  };

  if (isInitializing) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Initializing Google Calendar...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GoogleIcon sx={{ color: '#4285f4' }} />
          <Typography variant="h6">Google Calendar</Typography>
          {isAuthenticated && (
            <Chip
              icon={<CheckIcon />}
              label="Connected"
              color="success"
              size="small"
            />
          )}
        </Box>
        
        {isAuthenticated ? (
          <Button
            onClick={handleSignOut}
            startIcon={<LogoutIcon />}
            variant="outlined"
            color="error"
            size="small"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            onClick={handleSignIn}
            startIcon={<GoogleIcon />}
            variant="contained"
            disabled={isLoading}
            sx={{
              backgroundColor: '#4285f4',
              '&:hover': {
                backgroundColor: '#3367d6'
              }
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Connect'}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!isAuthenticated && !error && (
        <Typography variant="body2" color="text.secondary">
          Connect your Google Calendar to sync your tasks and view them alongside your calendar events.
          <br />
          <strong>Setup required:</strong> Configure your Google OAuth Client ID in the environment variables.
        </Typography>
      )}

      {isAuthenticated && (
        <Typography variant="body2" color="text.secondary">
          Your Google Calendar is connected. Tasks with due dates will be synced to your calendar.
        </Typography>
      )}
    </Paper>
  );
};

export default GoogleCalendarAuth;
