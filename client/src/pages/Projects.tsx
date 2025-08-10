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
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  PlayArrow, 
  CheckCircle, 
  MoreVert, 
  Edit, 
  Delete,
  Add,
  Folder as ProjectIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Task, Project } from '../types';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import ProjectView from '../components/ProjectView';
import TaskEditDialog from '../components/TaskEditDialog';

const Projects: React.FC = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProject, setMenuProject] = useState<Project | null>(null);

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

  const handleMarkDone = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { 
        title: task.title,
        description: task.description || undefined,
        status: 'COMPLETED',
        priority: task.priority,
        project: task.project || undefined,
        assignee: task.assignee || undefined,
        dueDate: task.dueDate || undefined,
        tags: task.tags
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error marking task as done:', error);
    }
  };

  const handleUnmarkDone = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { 
        title: task.title,
        description: task.description || undefined,
        status: 'PENDING',
        priority: task.priority,
        project: task.project || undefined,
        assignee: task.assignee || undefined,
        dueDate: task.dueDate || undefined,
        tags: task.tags
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error unmarking task as done:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    try {
      await taskService.updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description || undefined,
        status: updatedTask.status,
        priority: updatedTask.priority,
        project: updatedTask.project || undefined,
        assignee: updatedTask.assignee || undefined,
        dueDate: updatedTask.dueDate || undefined,
        tags: updatedTask.tags
      });
      setEditDialogOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await taskService.deleteTask(task.id);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStop = async (task: Task) => {
    try {
      await taskService.updateTask(task.id, { 
        title: task.title,
        description: task.description || undefined,
        status: 'PENDING',
        priority: task.priority,
        project: task.project || undefined,
        assignee: task.assignee || undefined,
        dueDate: task.dueDate || undefined,
        tags: task.tags
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  };

  const handleProjectAction = async (project: Project, action: 'start' | 'complete' | 'delete') => {
    try {
      switch (action) {
        case 'start':
          await projectService.startProject(project.id);
          break;
        case 'complete':
          await projectService.completeProject(project.id);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
            await projectService.deleteProject(project.id);
          }
          break;
      }
      await fetchProjects();
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
    }
    setAnchorEl(null);
    setMenuProject(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setMenuProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuProject(null);
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
          sx={{ mb: 2 }}
        >
          ← Back to Projects
        </Button>
        <ProjectView
          tasks={projectTasks}
          onMarkDone={handleMarkDone}
          onUnmarkDone={handleUnmarkDone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStop={handleStop}
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
                    {/* Header with title and menu */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, mr: 1 }}>
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
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, project);
                        }}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: cat.ring }
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
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
                    {project.status === 'PENDING' && (
                      <Button
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectAction(project, 'start');
                        }}
                        sx={{
                          color: cat.ring,
                          borderColor: cat.ring,
                          '&:hover': {
                            backgroundColor: cat.bg,
                            borderColor: cat.ring
                          }
                        }}
                        variant="outlined"
                      >
                        Start
                      </Button>
                    )}
                    {project.status === 'STARTED' && (
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectAction(project, 'complete');
                        }}
                        sx={{
                          color: theme.palette.success.main,
                          borderColor: theme.palette.success.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.08),
                            borderColor: theme.palette.success.main
                          }
                        }}
                        variant="outlined"
                      >
                        Complete
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuProject && handleProjectAction(menuProject, 'start')}>
          <PlayArrow sx={{ mr: 1 }} />
          Start Project
        </MenuItem>
        <MenuItem onClick={() => menuProject && handleProjectAction(menuProject, 'complete')}>
          <CheckCircle sx={{ mr: 1 }} />
          Complete Project
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Project
        </MenuItem>
        <MenuItem 
          onClick={() => menuProject && handleProjectAction(menuProject, 'delete')}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Project
        </MenuItem>
      </Menu>

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
