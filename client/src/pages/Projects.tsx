import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Grid,
  Chip,
  LinearProgress,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  Add,
  Folder as ProjectIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ArrowBack
} from '@mui/icons-material';
import { Task, Project } from '../types';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import ProjectDetailView from '../components/ProjectDetailView';
import TaskEditDialog from '../components/TaskEditDialog';
import { useTaskActionsWithConfirm } from '../hooks/useTaskActions';

const Projects: React.FC = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Use the new task actions hook with refresh callback
  const { 
    markDone, 
    unmarkDone, 
    startTask, 
    stopTask, 
    deleteTask, 
    updateTask 
  } = useTaskActionsWithConfirm(() => {
    fetchTasks();
    fetchProjects(); // Refresh projects to update status
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projects = await projectService.getProjects();
      setProjects(projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasks = await taskService.getTasks();
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Simplified task action handlers using the new hook
  const handleMarkDone = markDone;

  const handleUnmarkDone = unmarkDone;

  const handleEdit = (task: Task) => {
    console.log('Projects handleEdit called with task:', task);
    setEditingTask(task);
    setEditDialogOpen(true);
    console.log('Edit dialog should be open now');
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    await updateTask(updatedTask, updatedTask);
    setEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleDelete = deleteTask; // useTaskActionsWithConfirm already includes confirmation

  const handleStop = stopTask;

  const handleStart = startTask;

  const handleLinkTask = (task: Task) => {
    // TODO: Implement task linking functionality
    console.log('Link task clicked:', task);
  };

  const onViewDependencies = (task: Task) => {
    // TODO: Implement view dependencies functionality
    console.log('View dependencies clicked:', task);
  };

  const getProjectColorCategory = (project: Project) => {
    const baseColors = {
      PENDING: {
        ring: theme.palette.warning.main,
        chip: theme.palette.warning.main,
        bg: alpha(theme.palette.warning.main, 0.08)
      },
      STARTED: {
        ring: theme.palette.primary.main,
        chip: theme.palette.primary.main,
        bg: alpha(theme.palette.primary.main, 0.08)
      },
      COMPLETED: {
        ring: theme.palette.success.main,
        chip: theme.palette.success.main,
        bg: alpha(theme.palette.success.main, 0.08)
      },
      DELETED: {
        ring: theme.palette.error.main,
        chip: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, 0.08)
      }
    };

    return baseColors[project.status] || baseColors.PENDING;
  };

  const getProjectTasks = (projectName: string) => {
    return tasks.filter(task => task.project === projectName);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading projects...
        </Typography>
      </Box>
    );
  }

  if (selectedProject) {
    const projectTasks = getProjectTasks(selectedProject.name);
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          onClick={() => setSelectedProject(null)}
          startIcon={<ArrowBack />}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          Back to Projects
        </Button>
        
        <ProjectDetailView
          project={selectedProject}
          tasks={projectTasks}
          onViewDependencies={onViewDependencies}
          onMarkDone={handleMarkDone}
          onUnmarkDone={handleUnmarkDone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStop={handleStop}
          onStart={handleStart}
          onLinkTask={handleLinkTask}
          onTaskAdded={async () => {
            await fetchTasks();
            await fetchProjects(); // Update project status after adding task
          }}
        />
        
        {editingTask && (
          <TaskEditDialog
            open={editDialogOpen}
            task={editingTask}
            onClose={() => {
              setEditDialogOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveEdit}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            // TODO: Implement create project dialog
            console.log('Create project clicked');
          }}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1
          }}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '50vh',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first project to get started
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => {
            const projectTasks = getProjectTasks(project.name);
            const completedTasks = projectTasks.filter(t => t.status === 'COMPLETED').length;
            const totalTasks = projectTasks.length;
            const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const cat = getProjectColorCategory(project);
            const isOverdue = project.overdue || false;

            return (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  onClick={() => setSelectedProject(project)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: `1px solid ${cat.ring}40`,
                    borderBottom: `1px solid ${cat.ring}40`,
                    background: theme.palette.background.paper,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: theme.shadows[1],
                    transition: `all ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
                    '&:hover': {
                      background: cat.bg,
                      borderBottom: `4px solid ${cat.ring}`,
                      borderTop: `1px solid ${cat.ring}40`,
                      borderLeft: `1px solid ${cat.ring}40`,
                      borderRight: `1px solid ${cat.ring}40`,
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                    {/* Header with title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ProjectIcon sx={{ color: cat.ring, fontSize: '1.2rem' }} />
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: 'text.primary',
                          lineHeight: 1.2
                        }}
                      >
                        {project.name}
                      </Typography>
                    </Box>

                    {/* Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {project.description || 'No description'}
                    </Typography>

                    {/* Status and Owner chips */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={project.status} 
                        size="small"
                        sx={{
                          backgroundColor: `${cat.chip}20`,
                          color: cat.chip,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          border: `1px solid ${cat.chip}40`
                        }}
                      />
                      {project.owner && (
                        <Chip 
                          icon={<PersonIcon sx={{ fontSize: '0.8rem' }} />}
                          label={project.owner} 
                          variant="outlined"
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: 'text.secondary'
                            }
                          }}
                        />
                      )}
                    </Box>

                    {/* Progress and Due Date */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Progress: {completedTasks}/{totalTasks} tasks ({Math.round(progressPercent)}%)
                        </Typography>
                        {project.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography 
                              variant="body2" 
                              color={isOverdue ? 'error.main' : 'text.secondary'} 
                              sx={{ 
                                fontSize: '0.75rem',
                                fontWeight: isOverdue ? 600 : 400
                              }}
                            >
                              {new Date(project.dueDate).toLocaleDateString()}
                            </Typography>
                            {isOverdue && (
                              <Chip 
                                label="Overdue" 
                                color="error" 
                                size="small" 
                                sx={{ 
                                  height: 16, 
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  ml: 0.5
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressPercent} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: alpha(cat.ring, 0.1),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: cat.ring,
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-start' }}>
                    {/* Project status is automatically managed by the server based on task states */}
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Status automatically updates based on task progress
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {editingTask && (
        <TaskEditDialog
          open={editDialogOpen}
          task={editingTask}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </Box>
  );
};

export default Projects;
