import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FolderOpen as ProjectIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  PlayArrow as ActiveIcon
} from '@mui/icons-material';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface ProjectViewProps {
  tasks: Task[];
  onViewDependencies?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onUnmarkDone?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStop?: (task: Task) => void;
  onLinkTask?: (task: Task) => void;
}

interface ProjectGroup {
  name: string;
  tasks: Task[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    active: number;
    overdue: number;
  };
}

const ProjectView: React.FC<ProjectViewProps> = ({
  tasks,
  onViewDependencies,
  onMarkDone,
  onUnmarkDone,
  onEdit,
  onDelete,
  onStop,
  onLinkTask
}) => {
  const theme = useTheme();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Group tasks by project
  const projectGroups: ProjectGroup[] = React.useMemo(() => {
    const groups = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      const projectName = task.project || 'No Project';
      if (!groups.has(projectName)) {
        groups.set(projectName, []);
      }
      groups.get(projectName)!.push(task);
    });

    return Array.from(groups.entries()).map(([name, projectTasks]) => {
      const stats = {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.status === 'COMPLETED').length,
        pending: projectTasks.filter(t => t.status === 'PENDING').length,
        active: projectTasks.filter(t => t.status === 'ACTIVE').length,
        overdue: projectTasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date();
        }).length
      };

      return {
        name,
        tasks: projectTasks.sort((a, b) => {
          // Sort by urgency, then by due date
          if (a.urgency !== b.urgency) {
            return (b.urgency || 0) - (a.urgency || 0);
          }
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return 0;
        }),
        stats
      };
    }).sort((a, b) => {
      // Sort projects by completion percentage (ascending), then by name
      const aCompletion = a.stats.total > 0 ? a.stats.completed / a.stats.total : 0;
      const bCompletion = b.stats.total > 0 ? b.stats.completed / b.stats.total : 0;
      
      if (aCompletion !== bCompletion) {
        return aCompletion - bCompletion; // Incomplete projects first
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [tasks]);

  const handleProjectToggle = (projectName: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectName)) {
        newExpanded.delete(projectName);
      } else {
        newExpanded.add(projectName);
      }
      return newExpanded;
    });
  };

  const getProjectCompletionColor = (stats: ProjectGroup['stats']) => {
    const completion = stats.total > 0 ? stats.completed / stats.total : 0;
    if (completion === 1) return 'success';
    if (completion >= 0.7) return 'info';
    if (completion >= 0.3) return 'warning';
    return 'error';
  };

  if (projectGroups.length === 0) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(0,0,0,0) 100%)',
        borderRadius: 2,
        border: '1px solid rgba(25,118,210,0.1)'
      }}>
        <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No projects found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create tasks with project names to see them organized here
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ width: '100%', position: 'relative' }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ProjectIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Project View
        </Typography>
        <Chip 
          label={`${projectGroups.length} project${projectGroups.length !== 1 ? 's' : ''}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {projectGroups.map((project) => {
        const isExpanded = expandedProjects.has(project.name);
        const completionPercentage = project.stats.total > 0 
          ? Math.round((project.stats.completed / project.stats.total) * 100) 
          : 0;

        return (
          <Card
            key={project.name}
            className="glass-task-container"
            sx={{
              mb: 2,
              overflow: 'hidden'
            }}
          >
            <Accordion
              expanded={isExpanded}
              onChange={() => handleProjectToggle(project.name)}
              sx={{
                boxShadow: 'none',
                background: 'transparent',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  py: 1,
                  minHeight: 64,
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <ProjectIcon sx={{ color: 'primary.main' }} />
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {project.name.toUpperCase()}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        icon={<TaskIcon />}
                        label={`${project.stats.total} task${project.stats.total !== 1 ? 's' : ''}`}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      
                      {project.stats.completed > 0 && (
                        <Chip
                          icon={<CompletedIcon />}
                          label={`${project.stats.completed} done`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                      
                      {project.stats.active > 0 && (
                        <Chip
                          icon={<ActiveIcon />}
                          label={`${project.stats.active} started`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                      
                      {project.stats.overdue > 0 && (
                        <Chip
                          icon={<PendingIcon />}
                          label={`${project.stats.overdue} overdue`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {completionPercentage}% Complete
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={completionPercentage}
                      color={getProjectCompletionColor(project.stats)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.grey[300], 0.3),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ px: 2, py: 0, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {project.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      selected={task.id === selectedTaskId}
                      onSelect={() => setSelectedTaskId(prev => prev === task.id ? null : task.id)}
                      onViewDependencies={onViewDependencies}
                      onMarkDone={onMarkDone}
                      onUnmarkDone={onUnmarkDone}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStop={onStop}
                      onLinkTask={onLinkTask}
                      compact={true}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Card>
        );
      })}
    </Box>
  );
};

export default ProjectView;
