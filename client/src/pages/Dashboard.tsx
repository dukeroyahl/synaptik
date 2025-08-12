import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box, Card, useTheme } from '@mui/material'
import TaskList from '../components/TaskList'
import DashboardInsights from '../components/DashboardInsights'
import TaskTrendChart from '../components/TaskTrendChart'
import { taskService } from '../services/taskService'
import DailyGlance from '../components/DailyGlance'
import TaskCapture from '../components/TaskCapture'
import UnifiedFilter from '../components/UnifiedFilter'
import { useFilterStore } from '../stores/filterStore'

const Dashboard = memo(() => {
  const theme = useTheme();
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([])
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  
  // Use only store state - single source of truth
  const status = useFilterStore(s => s.status)
  const setStatus = useFilterStore(s => s.setStatus)
  const overviewMode = useFilterStore(s => s.overviewMode)
  const dueDate = useFilterStore(s => s.dueDate)
  const setDueDate = useFilterStore(s => s.setDueDate)

  const fetchAssignees = useCallback(async () => {
    try {
      const tasks = await taskService.getTasks();
      
      // Extract unique assignees from tasks
      const assignees = tasks
        .filter((task: any) => task.assignee)
        .map((task: any) => task.assignee as string);
      
      // Extract unique projects from tasks
      const projects = tasks
        .filter((task: any) => task.project)
        .map((task: any) => task.project as string);
      
      // Remove duplicates
      const uniqueAssignees = [...new Set(assignees)] as string[];
      const uniqueProjects = [...new Set(projects)] as string[];
      
      // Add special "No" options to the beginning of each list
      setAvailableAssignees(['(No Assignee)', ...uniqueAssignees]);
      setAvailableProjects(['(No Project)', ...uniqueProjects]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch assignees and projects:', error);
      }
    }
  }, []);

  const handleTaskCaptured = useCallback(() => {
    // This will trigger refresh in child components
    fetchAssignees();
    setRefreshCounter(prev => prev + 1);
  }, [fetchAssignees]);

  // Fetch assignees when component mounts
  useEffect(() => {
    fetchAssignees();
  }, []); // Remove fetchAssignees dependency to prevent re-renders

  const handleStatusFilterChange = useCallback((filter: 'pending' | 'active' | 'completed' | 'overdue' | 'all') => {
    setStatus(filter)
  }, [setStatus]);

  // Simplified active filter calculation using store state
  const activeFilter = useMemo(() => {
    // Overview mode takes precedence
    if (overviewMode === 'open') {
      return 'all';
    }
    if (overviewMode === 'closed') {
      return 'COMPLETED';
    }
    
    // Default to showing all open tasks when no specific filter is selected
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'completed':
        return 'COMPLETED';
      case 'active':
        return 'ACTIVE';
      case 'overdue':
        return 'overdue';
      case 'all':
      default:
        return 'all'; // Show all open tasks (pending + active) by default
    }
  }, [status, overviewMode]);

  return (
    <Box sx={{ 
      display: 'grid',
      gap: { xs: 1, sm: 1.5 },
      gridTemplateRows: { 
        xs: 'auto auto auto auto', // Stack vertically on mobile
        md: 'minmax(260px, auto) 1fr' // Charts row + content row on desktop
      },
      gridTemplateColumns: {
        xs: '1fr', // Single column on mobile
        md: 'minmax(320px, 1fr) 2fr', // Flexible sidebar + main content on desktop
        lg: 'minmax(340px, 1fr) 3fr' // Wider main content on large screens
      },
      minHeight: '100vh'
    }}>
      {/* Row 1 - Overview aligned with sidebar, Charts aligned with main content */}
      <Box sx={{ 
        gridColumn: { xs: '1', md: '1' },
        gridRow: { xs: 'auto', md: '1' },
        width: '100%',
        maxWidth: { xs: '100%', md: '100%' }
      }}>
        <DailyGlance 
          onFilterChange={handleStatusFilterChange}
          activeFilter={status}
          onDueDateChange={(d) => setDueDate(d ?? undefined)}
          activeDueDate={dueDate || null}
          fullHeight
          refreshCounter={refreshCounter}
        />
      </Box>

      {/* Charts spanning the main content area */}
      <Box sx={{ 
        gridColumn: { xs: '1', md: '2' },
        gridRow: { xs: 'auto', md: '1' },
        display: 'grid',
        gap: 1,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        minHeight: { xs: 'auto', md: 260 }
      }}>
        <TaskTrendChart />
        <DashboardInsights />
      </Box>

      {/* Row 2 - Task Capture and Filters */}
      <Box sx={{ 
        gridColumn: { xs: '1', md: '1' },
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        minWidth: 0,
        width: '100%',
        maxWidth: { xs: '100%', md: '100%' }
      }}>
        {/* Quick Task Capture */}
        <Card 
          elevation={theme.palette.mode === 'dark' ? 3 : 1} 
          sx={{ 
            p: { xs: 1, sm: 1.5 },
            width: '100%',
            boxSizing: 'border-box'
          }} 
          className="glass-task-container"
        >
          <TaskCapture onTaskCaptured={handleTaskCaptured} />
        </Card>
        
        {/* Search & Filters */}
        <Card 
          elevation={theme.palette.mode === 'dark' ? 2 : 1} 
          sx={{ 
            p: { xs: 1, sm: 1.25 }, 
            flex: 1,
            width: '100%',
            boxSizing: 'border-box'
          }} 
          className="glass-task-container"
        >
          <UnifiedFilter 
            layout="inline"
            projects={availableProjects}
            assignees={availableAssignees}
          />
        </Card>
      </Box>

      {/* Row 3 - Task List */}
      <Box sx={{ 
        gridColumn: { xs: '1', md: '2' },
        gridRow: { xs: 'auto', md: '2' },
        minWidth: 0,
        minHeight: { xs: '400px', md: 0 }
      }}>
        <Card 
          elevation={theme.palette.mode === 'dark' ? 2 : 1} 
          className="custom-card glass-task-container" 
          sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}
        >
          <TaskList 
            key={`${status}-${refreshCounter}-${dueDate || 'none'}`}
            filter={activeFilter as 'PENDING' | 'ACTIVE' | 'overdue' | 'COMPLETED' | 'all'} 
            onTaskUpdate={handleTaskCaptured}
          />
        </Card>
      </Box>
    </Box>
  )
});

// Set display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard
