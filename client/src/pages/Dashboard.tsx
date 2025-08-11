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
    
    switch (status) {
      case 'all':
      case 'pending':
        return 'PENDING';
      case 'completed':
        return 'COMPLETED';
      case 'active':
        return 'ACTIVE';
      case 'overdue':
        return 'overdue';
      default:
        return 'PENDING';
    }
  }, [status, overviewMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 2x2 Flex Layout */}
  {/* Row 1 */}
	<Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, minHeight: 260 }}>
          {/* Cell 1,1: Today's Preview (fixed width) */}
      <Box sx={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <DailyGlance 
              onFilterChange={handleStatusFilterChange}
              activeFilter={status}
              onDueDateChange={(d) => setDueDate(d ?? undefined)}
              activeDueDate={dueDate || null}
        fullHeight
            />
          </Box>
          {/* Top Row - Daily Glance + Charts & Insights */}
          <Box sx={{ flex: 1, minWidth: 600, display: 'flex', gap: 1, overflow: 'hidden' }}>
            <TaskTrendChart sx={{ flex: '0 0 50%', width: '50%', minWidth: 380 }} />
            <DashboardInsights sx={{ flex: '0 0 50%', width: '50%', minWidth: 260 }} />
          </Box>
        </Box>

        {/* Bottom Row - Left Sidebar (Task Capture + Filters) + Right Task List */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {/* Left Column - Task Capture + Search & Filters */}
          <Box sx={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Quick Task Capture */}
            <Card elevation={theme.palette.mode === 'dark' ? 3 : 1} sx={{ p: 1.5 }} className="glass-task-container">
              <TaskCapture onTaskCaptured={handleTaskCaptured} />
            </Card>
            
            {/* Search & Filters */}
            <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} sx={{ p: 1.25, flex: 1 }} className="glass-task-container">
              <UnifiedFilter 
                layout="inline"
                projects={availableProjects}
                assignees={availableAssignees}
              />
            </Card>
          </Box>

          {/* Right Column - Task List */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} className="custom-card glass-task-container" sx={{ p: 2, height: '100%' }}>
              <TaskList 
                key={`${status}-${refreshCounter}-${dueDate || 'none'}`}
                filter={activeFilter as 'PENDING' | 'ACTIVE' | 'overdue' | 'COMPLETED' | 'all'} 
                onTaskUpdate={handleTaskCaptured}
              />
            </Card>
          </Box>
        </Box>
    </Box>
  )
});

// Set display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard
