import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Folder as ProjectIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as ActiveIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon
} from '@mui/icons-material';
import { TaskDTO, Project } from '../types';
import { TaskActionCallbacks } from '../types/common';
import TaskCard from './TaskCard';
import TaskCapture from './TaskCapture';
import { parseBackendDate } from '../utils/dateUtils';
import { isTaskOverdue } from '../utils/taskUtils';

interface ProjectDetailViewProps extends TaskActionCallbacks {
  project: Project;
  tasks: TaskDTO[];
  onStop?: (task: TaskDTO) => void;
  onTaskAdded?: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  tasks,
  onViewDependencies,
  onMarkDone,
  onUnmarkDone,
  onEdit,
  onDelete,
  onStop,
  onStart,
  onLinkTask,
  onTaskAdded,
}) => {
  const theme = useTheme();

  // Calculate project statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const active = tasks.filter(t => t.status === 'ACTIVE').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const overdue = tasks.filter(t => t.dueDate && isTaskOverdue(t.dueDate)).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, pending, overdue, progress };
  }, [tasks]);

  // Get status color
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED': return theme.palette.success.main;
      case 'STARTED': return theme.palette.primary.main;
      case 'PENDING': return theme.palette.warning.main;
      case 'DELETED': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  // Format due date
  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return 'No due date';
    try {
      const date = parseBackendDate(dueDate);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Box>
      {/* Project Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <ProjectIcon 
              sx={{ 
                fontSize: 40, 
                color: getStatusColor(project.status),
                mt: 0.5
              }} 
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {project.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={project.status}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getStatusColor(project.status), 0.1),
                    color: getStatusColor(project.status),
                    fontWeight: 500,
                  }}
                />
                {project.owner && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {project.owner}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Due: {formatDueDate(project.dueDate)}
                  </Typography>
                </Box>
                {/* Progress inline with metadata */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      flexGrow: 1,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                    {stats.completed}/{stats.total} ({stats.progress}%)
                  </Typography>
                </Box>
              </Box>

              {project.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {project.description}
                </Typography>
              )}

              {/* Project Statistics */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <TaskIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="h6">{stats.total}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <CompletedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="h6" color="success.main">{stats.completed}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <ActiveIcon sx={{ fontSize: 16, color: 'info.main' }} />
                      <Typography variant="h6" color="info.main">{stats.active}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Active
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                      <PendingIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="h6" color="warning.main">{stats.pending}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {stats.overdue > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  p: 1, 
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <OverdueIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="body2" color="error.main">
                    {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Tasks Section */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskIcon />
          Project Tasks
        </Typography>

        {/* Quick Task Add */}
        <Box sx={{ mb: 3 }}>
          <TaskCapture 
            projectName={project.name}
            onTaskCaptured={onTaskAdded}
          />
        </Box>

        {tasks.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks in this project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasks assigned to this project will appear here.
            </Typography>
          </Card>
        ) : (
          <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onViewDependencies={onViewDependencies}
                onMarkDone={onMarkDone}
                onUnmarkDone={onUnmarkDone}
                onEdit={onEdit}
                onDelete={onDelete}
                onStop={onStop}
                onStart={onStart}
                onLinkTask={onLinkTask}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProjectDetailView;
