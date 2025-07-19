import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  alpha,
  Button,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  FolderOutlined as ProjectIcon,
  CalendarToday as CalendarIcon,
  ClearAll as ClearAllIcon,
  AccountTree as DependencyIcon
} from '@mui/icons-material'
import TaskList from '../components/TaskList'
import DailyGlance from '../components/DailyGlance'
import TaskCapture from '../components/TaskCapture'
import UnifiedDependencyView from '../components/UnifiedDependencyView'

const Dashboard = memo(() => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0)
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'overdue' | 'today' | 'all'>('pending')
  const [refreshCounter, setRefreshCounter] = useState(0)
  
  // Quick filters state
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [dueDateFilter, setDueDateFilter] = useState<string>('')
  const [availableProjects, setAvailableProjects] = useState<string[]>([])
  const [quickAssigneeFilter, setQuickAssigneeFilter] = useState<string>('')
  
  // Dependency view state
  const [dependencyViewOpen, setDependencyViewOpen] = useState(false)

  const fetchAssignees = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      
      if (response.ok) {
        // Backend returns array directly, not wrapped
        const tasks = Array.isArray(result) ? result : [];
        
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
        
        setAvailableAssignees(uniqueAssignees);
        setAvailableProjects(uniqueProjects);
      }
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

  const clearAllQuickFilters = useCallback(() => {
    setProjectFilter('');
    setQuickAssigneeFilter('');
    setDueDateFilter('');
  }, []);

  // Fetch assignees when component mounts
  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const handleClearFilter = useCallback(() => {
    setAssigneeFilter('');
  }, []);

  const handleStatusFilterChange = useCallback((filter: 'pending' | 'completed' | 'overdue' | 'today' | 'all') => {
    setStatusFilter(filter);
    // Also update the tab if switching between pending/completed
    if (filter === 'completed') {
      setActiveTab(1);
    } else if (filter === 'pending' || filter === 'overdue' || filter === 'today') {
      setActiveTab(0);
    }
  }, []);

  const handleTabChange = useCallback((newValue: number) => {
    setActiveTab(newValue);
    // Update status filter based on tab
    if (newValue === 0) {
      setStatusFilter('pending');
    } else if (newValue === 1) {
      setStatusFilter('completed');
    }
  }, []);

  // Memoize active filter calculation
  const activeFilter = useMemo(() => {
    if (activeTab === 1) return 'completed';
    return statusFilter === 'all' ? 'pending' : statusFilter;
  }, [activeTab, statusFilter]);

  // Memoize combined assignee filter
  const combinedAssigneeFilter = useMemo(() => 
    assigneeFilter || quickAssigneeFilter, 
    [assigneeFilter, quickAssigneeFilter]
  );

  // Memoize filter check for UI state
  const hasActiveFilters = useMemo(() => 
    assigneeFilter || projectFilter || dueDateFilter, 
    [assigneeFilter, projectFilter, dueDateFilter]
  );

  return (
    <Box>
      {/* Compact Top Section: Today's Overview and Right Column */}
      <Grid container spacing={2}>
        {/* Today's Overview - Left Column */}
        <Grid item xs={12} md={4} lg={3.6}>
          <DailyGlance 
            onFilterChange={handleStatusFilterChange}
            activeFilter={statusFilter}
          />
        </Grid>

        {/* Right Column - Task Capture and Quick Filters */}
        <Grid item xs={12} md={8} lg={8.4}>
          <Stack spacing={2}>
            {/* Quick Task Capture */}
            <TaskCapture onTaskCaptured={handleTaskCaptured} />
            
            {/* Quick Filters */}
            <Card 
              elevation={theme.palette.mode === 'dark' ? 1 : 0} 
              className="custom-card glass-task-container"
              sx={{
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
                  : alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Quick Filters</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<DependencyIcon />}
                      onClick={() => setDependencyViewOpen(true)}
                      variant="outlined"
                      sx={{ py: 0.5, px: 1.5 }}
                    >
                      Dependencies
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ClearAllIcon />}
                      onClick={clearAllQuickFilters}
                      sx={{ py: 0.5, px: 1 }}
                      disabled={!hasActiveFilters}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>
                
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Project</InputLabel>
                      <Select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value as string)}
                        label="Project"
                      >
                        <MenuItem value="">All Projects</MenuItem>
                        {availableProjects.map((project) => (
                          <MenuItem key={project} value={project}>{project}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Assignee</InputLabel>
                      <Select
                        value={quickAssigneeFilter}
                        onChange={(e) => setQuickAssigneeFilter(e.target.value as string)}
                        label="Assignee"
                      >
                        <MenuItem value="">All Assignees</MenuItem>
                        {availableAssignees.map((assignee) => (
                          <MenuItem key={assignee} value={assignee}>{assignee}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Due Date</InputLabel>
                      <Select
                        value={dueDateFilter}
                        onChange={(e) => setDueDateFilter(e.target.value as string)}
                        label="Due Date"
                      >
                        <MenuItem value="">All Dates</MenuItem>
                        <MenuItem value="today">Due Today</MenuItem>
                        <MenuItem value="tomorrow">Due Tomorrow</MenuItem>
                        <MenuItem value="this-week">This Week</MenuItem>
                        <MenuItem value="next-week">Next Week</MenuItem>
                        <MenuItem value="this-month">This Month</MenuItem>
                        <MenuItem value="overdue">Overdue</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                {/* Active Quick Filters Display */}
                {hasActiveFilters && (
                  <Box sx={{ mt: 1.5 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {projectFilter && (
                        <Chip 
                          size="small" 
                          label={`${projectFilter}`} 
                          onDelete={() => setProjectFilter('')}
                          icon={<ProjectIcon fontSize="small" />}
                          color="primary"
                          variant="outlined"
                          sx={{ height: '24px' }}
                        />
                      )}
                      {quickAssigneeFilter && (
                        <Chip 
                          size="small" 
                          label={`${quickAssigneeFilter}`} 
                          onDelete={() => setQuickAssigneeFilter('')}
                          icon={<PersonIcon fontSize="small" />}
                          color="secondary"
                          variant="outlined"
                          sx={{ height: '24px' }}
                        />
                      )}
                      {dueDateFilter && (
                        <Chip 
                          size="small" 
                          label={`${dueDateFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`} 
                          onDelete={() => setDueDateFilter('')}
                          icon={<CalendarIcon fontSize="small" />}
                          color="info"
                          variant="outlined"
                          sx={{ height: '24px' }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Task Lists with Tabs */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Card elevation={theme.palette.mode === 'dark' ? 2 : 1} className="custom-card glass-task-container">
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={(_, newValue) => handleTabChange(newValue)}>
                    <Tab label="Not Done" />
                    <Tab label="Completed" />
                  </Tabs>
                </Box>
                
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "primary" : "default"}
                >
                  <FilterIcon />
                </IconButton>
              </Box>

              {showFilters && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filters
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Assignee</InputLabel>
                        <Select
                          value={assigneeFilter}
                          onChange={(e) => setAssigneeFilter(e.target.value as string)}
                          label="Assignee"
                        >
                          <MenuItem value="">All</MenuItem>
                          {availableAssignees.map((assignee) => (
                            <MenuItem key={assignee} value={assignee}>{assignee}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item>
                      {assigneeFilter && (
                        <IconButton size="small" onClick={handleClearFilter}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                  
                  {(assigneeFilter || (statusFilter !== 'pending' && statusFilter !== 'completed')) && (
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Typography variant="body2">Active filters:</Typography>
                      {assigneeFilter && (
                        <Chip 
                          size="small" 
                          label={assigneeFilter} 
                          onDelete={handleClearFilter}
                          icon={<PersonIcon fontSize="small" />}
                        />
                      )}
                      {statusFilter !== 'pending' && statusFilter !== 'completed' && (
                        <Chip 
                          size="small" 
                          label={statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} 
                          onDelete={() => setStatusFilter(activeTab === 0 ? 'pending' : 'completed')}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  )}
                </Box>
              )}

              {activeTab === 0 && (
                <TaskList 
                  key={`active-${refreshCounter}`}
                  filter={activeFilter as 'pending' | 'active' | 'overdue' | 'today' | 'completed' | 'all'} 
                  onTaskUpdate={handleTaskCaptured}
                  assigneeFilter={combinedAssigneeFilter}
                  projectFilter={projectFilter}
                  dueDateFilter={dueDateFilter}
                />
              )}
              {activeTab === 1 && (
                <TaskList 
                  key={`completed-${refreshCounter}`}
                  filter="completed" 
                  onTaskUpdate={handleTaskCaptured}
                  assigneeFilter={combinedAssigneeFilter}
                  projectFilter={projectFilter}
                  dueDateFilter={dueDateFilter}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Unified Dependency View Dialog */}
      <UnifiedDependencyView
        open={dependencyViewOpen}
        onClose={() => setDependencyViewOpen(false)}
      />
    </Box>
  )
});

// Set display name for debugging
Dashboard.displayName = 'Dashboard';

export default Dashboard
