import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box, Card, useTheme } from '@mui/material'
import TaskList from '../components/TaskList'
import DashboardInsights from '../components/DashboardInsights'
import TaskTrendChart from '../components/TaskTrendChart'
import { taskService } from '../services/taskService'
import DailyGlance from '../components/DailyGlance'
// Removed combined CaptureFilterBar in favor of explicit cells
import TaskCapture from '../components/TaskCapture'
import ActiveFiltersBar from '../components/ActiveFiltersBar'
import FilterSidebar from '../components/FilterSidebar'
import { useFilterStore } from '../stores/filterStore'

const Dashboard = memo(() => {
  const theme = useTheme();
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([])
  // Local status kept for keying TaskList; will sync with store
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active' | 'completed' | 'overdue' | 'all'>('pending')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  // Subscribe to store status + setter
  const storeStatus = useFilterStore(s => s.status)
  const setStoreStatus = useFilterStore(s => s.setStatus)
  const overviewMode = useFilterStore(s => s.overviewMode)
  const dueDate = useFilterStore(s => s.dueDate)
  const setDueDate = useFilterStore(s => s.setDueDate)
  const [filterOpen, setFilterOpen] = useState(false)
  // Active filter count handled inside ActiveFiltersBar badge now

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

  useEffect(() => {
    // Sync local status with store changes (e.g. from sidebar)
    if (statusFilter !== storeStatus) setStatusFilter(storeStatus)
  }, [storeStatus])

  const handleStatusFilterChange = useCallback((filter: 'pending' | 'active' | 'completed' | 'overdue' | 'all') => {
    setStoreStatus(filter)
  }, [setStoreStatus]);

  // Memoize active filter calculation
  const activeFilter = useMemo(() => {
    // Overview mode takes precedence
    if (overviewMode === 'open') {
      return 'all'; // TaskList will need to be updated to handle this properly
    }
    if (overviewMode === 'closed') {
      return 'COMPLETED';
    }
    
    switch (statusFilter) {
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
  }, [statusFilter, overviewMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 2x2 Flex Layout */}
  {/* Row 1 */}
	<Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, minHeight: 260 }}>
          {/* Cell 1,1: Today's Preview (fixed width) */}
      <Box sx={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <DailyGlance 
              onFilterChange={handleStatusFilterChange}
              activeFilter={statusFilter}
              onDueDateChange={(d) => setDueDate(d || undefined)}
              activeDueDate={dueDate || null}
        fullHeight
            />
          </Box>
          {/* Cell 1,2: Chart + Insights fixed split (40% / 60%) */}
          <Box sx={{ flex: 1, minWidth: 600, display: 'flex', gap: 1, overflow: 'hidden' }}>
            <TaskTrendChart sx={{ flex: '0 0 50%', width: '50%', minWidth: 380 }} />
            <DashboardInsights sx={{ flex: '0 0 50%', width: '50%', minWidth: 260 }} />
          </Box>
        </Box>
  {/* Row 2 */}
  <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1 }}>
          {/* Cell 2,1: Quick Task Capture (fixed width) */}
          <Box sx={{ width: 340, flexShrink: 0 }}>
            <Card elevation={theme.palette.mode === 'dark' ? 3 : 1} sx={{ height: '100%', p: 1.5 }} className="glass-task-container">
              <TaskCapture onTaskCaptured={handleTaskCaptured} />
            </Card>
          </Box>
          {/* Cell 2,2: Filters (active filters bar) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} sx={{ height: '100%', p: 1.25 }} className="glass-task-container">
              <ActiveFiltersBar onOpenFilters={() => setFilterOpen(true)} filtersOpen={filterOpen} />
            </Card>
          </Box>
        </Box>
      {/* Task List below layout */}
      <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} className="custom-card glass-task-container" sx={{ mt: 1, p: 2 }}>
        <TaskList 
          key={`${statusFilter}-${refreshCounter}-${dueDate || 'none'}`}
          filter={activeFilter as 'PENDING' | 'ACTIVE' | 'overdue' | 'COMPLETED' | 'all'} 
          onTaskUpdate={handleTaskCaptured}
        />
      </Card>
      
      {/* Dependency view now accessible via Navbar */}
      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        projects={availableProjects}
        assignees={availableAssignees}
      />
    </Box>
  )
});

// Set display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard
