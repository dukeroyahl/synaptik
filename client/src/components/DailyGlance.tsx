import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { darkPalette } from '../utils/themeUtils';

interface TaskStats {
  pending: number;
  completed: number;
  overdue: number;
  today: number;
}

interface DailyGlanceProps {
  onFilterChange?: (filter: 'pending' | 'completed' | 'overdue' | 'today' | 'all') => void;
  activeFilter?: 'pending' | 'completed' | 'overdue' | 'today' | 'all';
}

const DailyGlance: React.FC<DailyGlanceProps> = ({ 
  onFilterChange,
  activeFilter = 'pending'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [stats, setStats] = useState<TaskStats>({
    pending: 0,
    completed: 0,
    overdue: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch pending tasks count
      const pendingResponse = await fetch('/api/tasks/pending');
      const pendingResult = await pendingResponse.json();
      const pendingCount = Array.isArray(pendingResult) ? pendingResult.length : 0;
      
      // Fetch completed tasks count
      const completedResponse = await fetch('/api/tasks/completed');
      const completedResult = await completedResponse.json();
      const completedCount = Array.isArray(completedResult) ? completedResult.length : 0;
      
      // Fetch overdue tasks count
      const overdueResponse = await fetch('/api/tasks/overdue');
      const overdueResult = await overdueResponse.json();
      const overdueCount = Array.isArray(overdueResult) ? overdueResult.length : 0;
      
      // Fetch today's tasks count
      const todayResponse = await fetch('/api/tasks/today');
      const todayResult = await todayResponse.json();
      const todayCount = Array.isArray(todayResult) ? todayResult.length : 0;
      
      setStats({
        pending: pendingCount,
        completed: completedCount,
        overdue: overdueCount,
        today: todayCount
      });
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage
  const totalTasks = stats.pending + stats.completed;
  const completionPercentage = totalTasks > 0 
    ? Math.round((stats.completed / totalTasks) * 100) 
    : 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            elevation={isDarkMode ? 2 : 1}
            sx={{ 
              height: '100%',
              background: isDarkMode 
                ? `linear-gradient(135deg, ${alpha(darkPalette.paper, 0.8)} 0%, ${alpha(darkPalette.background, 0.9)} 100%)`
                : theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative'
            }}
            className="glass-card"
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, 
                  ${theme.palette.error.main} 0%, 
                  ${theme.palette.warning.main} 33%, 
                  ${theme.palette.info.main} 66%, 
                  ${theme.palette.success.main} 100%)`
              }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon fontSize="small" />
                Today's Overview
                {onFilterChange && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontStyle: 'italic' }}>
                    Click to filter
                  </Typography>
                )}
              </Typography>
              
              {loading ? (
                <LinearProgress sx={{ my: 2 }} />
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Task Completion
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={completionPercentage} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.primary.main,
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {completionPercentage}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box 
                        onClick={() => onFilterChange?.('pending')}
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: activeFilter === 'pending' 
                            ? alpha(theme.palette.warning.main, 0.2)
                            : alpha(theme.palette.warning.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: onFilterChange ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-in-out',
                          border: activeFilter === 'pending' 
                            ? `2px solid ${theme.palette.warning.main}`
                            : '2px solid transparent',
                          '&:hover': onFilterChange ? {
                            backgroundColor: alpha(theme.palette.warning.main, 0.15),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`
                          } : {}
                        }}
                      >
                        <PendingIcon sx={{ 
                          color: theme.palette.warning.main, 
                          mb: 1,
                          fontSize: activeFilter === 'pending' ? '1.8rem' : '1.3rem',
                          transition: 'font-size 0.2s ease-in-out'
                        }} />
                        <Typography variant="h6">{stats.pending}</Typography>
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box 
                        onClick={() => onFilterChange?.('completed')}
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: activeFilter === 'completed' 
                            ? alpha(theme.palette.success.main, 0.2)
                            : alpha(theme.palette.success.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: onFilterChange ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-in-out',
                          border: activeFilter === 'completed' 
                            ? `2px solid ${theme.palette.success.main}`
                            : '2px solid transparent',
                          '&:hover': onFilterChange ? {
                            backgroundColor: alpha(theme.palette.success.main, 0.15),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`
                          } : {}
                        }}
                      >
                        <CompletedIcon sx={{ 
                          color: theme.palette.success.main, 
                          mb: 1,
                          fontSize: activeFilter === 'completed' ? '1.8rem' : '1.3rem',
                          transition: 'font-size 0.2s ease-in-out'
                        }} />
                        <Typography variant="h6">{stats.completed}</Typography>
                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box 
                        onClick={() => onFilterChange?.('overdue')}
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: activeFilter === 'overdue' 
                            ? alpha(theme.palette.error.main, 0.2)
                            : alpha(theme.palette.error.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: onFilterChange ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-in-out',
                          border: activeFilter === 'overdue' 
                            ? `2px solid ${theme.palette.error.main}`
                            : '2px solid transparent',
                          '&:hover': onFilterChange ? {
                            backgroundColor: alpha(theme.palette.error.main, 0.15),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                          } : {}
                        }}
                      >
                        <OverdueIcon sx={{ 
                          color: theme.palette.error.main, 
                          mb: 1,
                          fontSize: activeFilter === 'overdue' ? '2rem' : '1.5rem',
                          transition: 'font-size 0.2s ease-in-out'
                        }} />
                        <Typography variant="h5">{stats.overdue}</Typography>
                        <Typography variant="body2" color="text.secondary">Overdue</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box 
                        onClick={() => onFilterChange?.('today')}
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: activeFilter === 'today' 
                            ? alpha(theme.palette.info.main, 0.2)
                            : alpha(theme.palette.info.main, 0.1),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: onFilterChange ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-in-out',
                          border: activeFilter === 'today' 
                            ? `2px solid ${theme.palette.info.main}`
                            : '2px solid transparent',
                          '&:hover': onFilterChange ? {
                            backgroundColor: alpha(theme.palette.info.main, 0.15),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`
                          } : {}
                        }}
                      >
                        <TodayIcon sx={{ 
                          color: theme.palette.info.main, 
                          mb: 1,
                          fontSize: activeFilter === 'today' ? '2rem' : '1.5rem',
                          transition: 'font-size 0.2s ease-in-out'
                        }} />
                        <Typography variant="h5">{stats.today}</Typography>
                        <Typography variant="body2" color="text.secondary">Today</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DailyGlance;
