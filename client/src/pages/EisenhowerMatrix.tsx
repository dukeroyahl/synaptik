import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  useTheme, 
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  Schedule as ClockIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { Task } from '../types';
import { parseBackendDate } from '../utils/dateUtils';
import TaskEditDialog from '../components/TaskEditDialog';
import TaskCard from '../components/TaskCard';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateTaskId } from '../utils/taskUtils';
import { taskService } from '../services/taskService';
import { useTaskActionsWithConfirm } from '../hooks/useTaskActions';

function isUrgent(task: Task): boolean {
  if (!task.dueDate) {
    return false;
  }
  
  const now = new Date();
  const due = parseBackendDate(task.dueDate);
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const urgent = diff <= 30; // due within 30 days (including today) or overdue
  return urgent;
}

function isImportant(task: Task): boolean {
  const important = task.priority === 'HIGH' || task.priority === 'MEDIUM';
  return important;
}

const quadrantLabels = [
  { title: 'Urgent & Important', color: 'error.main', icon: FireIcon },
  { title: 'Important But Not Urgent', color: 'warning.main', icon: StarIcon },
  { title: 'Urgent But Not Important', color: 'info.main', icon: ClockIcon },
  { title: 'Not Urgent & Not Important', color: 'text.secondary', icon: InboxIcon },
];

// Helper to get new task fields for quadrant
function getTaskFieldsForQuadrant(idx: number, task: Task): Partial<Task> {
  const now = new Date();
  let dueDate: string | undefined = task.dueDate || undefined;
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = task.priority;
  
  if (idx === 0) { // Urgent & Important
    // Always set to 30 days from current date when moving TO this quadrant
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    dueDate = thirtyDaysFromNow.toISOString().split('T')[0];
    priority = 'HIGH';
  } else if (idx === 1) { // Not Urgent & Important
    // Always set to 90 days from current date when moving TO this quadrant
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    dueDate = ninetyDaysFromNow.toISOString().split('T')[0];
    priority = 'HIGH';
  } else if (idx === 2) { // Urgent & Not Important  
    // Always set to 30 days from current date when moving TO this quadrant
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    dueDate = thirtyDaysFromNow.toISOString().split('T')[0];
    priority = 'LOW';
  } else { // Not Urgent & Not Important
    // Remove due date completely
    dueDate = undefined;
    priority = 'LOW';
  }
  
  return { dueDate, priority };
}

interface SortableTaskProps {
  task: Task;
  quadrant: number;
  onEditTask: (task: Task) => void;
  onMarkDone: (task: Task) => void;
  onUnmarkDone: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onLinkTask: (task: Task) => void;
}

const SortableTask: React.FC<SortableTaskProps & { selected?: boolean; onSelect?: (task: Task) => void }> = ({ 
  task, 
  quadrant, 
  onEditTask,
  onMarkDone,
  onUnmarkDone,
  onDeleteTask,
  onLinkTask,
  selected,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { quadrant } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
    marginBottom: 8,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard 
        task={task}
        selected={selected}
        onSelect={() => onSelect?.(task)}
        onMarkDone={onMarkDone}
        onUnmarkDone={onUnmarkDone}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onLinkTask={onLinkTask}
        draggable={true}
        compact={true}
      />
    </div>
  );
};

interface DroppableQuadrantProps {
  quadrant: number;
  tasks: Task[];
  title: string;
  color: string;
  icon: React.ComponentType<any>;
  onEditTask: (task: Task) => void;
  onMarkDone: (task: Task) => void;
  onUnmarkDone: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onLinkTask: (task: Task) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<string | null>>;
}

const DroppableQuadrant: React.FC<DroppableQuadrantProps> = ({ 
  quadrant, 
  tasks, 
  title, 
  color, 
  icon: IconComponent, 
  onEditTask,
  onMarkDone,
  onUnmarkDone,
  onDeleteTask,
  onLinkTask,
  selectedTaskId,
  setSelectedTaskId
}) => {
  const theme = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id: `quadrant-${quadrant}`,
    data: { quadrant }
  });
  
  return (
    <Grid item xs={12} sm={6}>
      <Card 
        ref={setNodeRef}
        elevation={theme.palette.mode === 'dark' ? 2 : 1} 
        sx={{ 
          height: '100%', 
          minHeight: 300,
          border: isOver ? '2px solid #1976d2' : '2px solid transparent',
          backgroundColor: isOver ? '#e3f2fd' : 'inherit',
          transition: 'border-color 0.2s, background-color 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Watermark Icon */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <IconComponent sx={{ fontSize: 120 }} />
        </Box>
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" color={color} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconComponent sx={{ fontSize: 20 }} />
            {title}
          </Typography>
          {tasks.length === 0 ? (
            <Typography color="text.secondary">
              Drop tasks here
            </Typography>
          ) : (
            tasks.map((task) => (
              <SortableTask 
                key={task.id} 
                task={task} 
                quadrant={quadrant} 
                onEditTask={onEditTask}
                        onMarkDone={onMarkDone}
                onUnmarkDone={onUnmarkDone}
                onDeleteTask={onDeleteTask}
                onLinkTask={onLinkTask}
                selected={task.id === selectedTaskId}
                onSelect={(t) => setSelectedTaskId(prev => prev === t.id ? null : t.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

const EisenhowerMatrix: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Debug state changes
  const theme = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await taskService.getTasks();
      if (tasks && tasks.length > 0) {
      }
      setTasks(tasks || []);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the new task actions hook
  const { markDone, unmarkDone, deleteTask, updateTask } = useTaskActionsWithConfirm(fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Quadrants: 0 = urgent+important, 1 = not urgent+important, 2 = urgent+not important, 3 = not urgent+not important
  const quadrants = useMemo(() => {
    const result: Task[][] = [[], [], [], []];
    
    if (tasks.length === 0) {
      return result;
    }
    
    tasks.forEach((task) => {
      
      // Skip completed tasks if showCompleted is false
      if (!showCompleted && task.status === 'COMPLETED') {
        return;
      }
      
      const urgent = isUrgent(task);
      const important = isImportant(task);
      
      if (urgent && important) {
        result[0].push(task);
      } else if (!urgent && important) {
        result[1].push(task);
      } else if (urgent && !important) {
        result[2].push(task);
      } else {
        result[3].push(task);
      }
    });
    
    return result;
  }, [tasks, showCompleted]);

  const getTaskById = (id: string) => tasks.find((t) => t.id === id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = getTaskById(active.id as string);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      return;
    }

    const activeTask = getTaskById(active.id as string);
    if (!activeTask) {
      return;
    }

    // Check if dropped on a quadrant
    let targetQuadrant = -1;
    if (over.id.toString().startsWith('quadrant-')) {
      targetQuadrant = parseInt(over.id.toString().replace('quadrant-', ''));
    } else if (over.data.current?.quadrant !== undefined) {
      targetQuadrant = over.data.current.quadrant;
    }

    if (targetQuadrant === -1) {
      return;
    }

    // Get current quadrant
    const urgent = isUrgent(activeTask);
    const important = isImportant(activeTask);
    let currentQuadrant = 3;
    if (urgent && important) currentQuadrant = 0;
    else if (!urgent && important) currentQuadrant = 1;
    else if (urgent && !important) currentQuadrant = 2;

    if (currentQuadrant === targetQuadrant) {
      return;
    }

    // Update task fields for new quadrant
    const updatedFields = getTaskFieldsForQuadrant(targetQuadrant, activeTask);
    try {
      // Merge task data with updated fields then convert nulls to undefined
      const mergedData = {
        title: activeTask.title,
        description: activeTask.description,
        project: activeTask.project,
        assignee: activeTask.assignee,
        dueDate: activeTask.dueDate,
        waitUntil: activeTask.waitUntil,
        priority: activeTask.priority,
        status: activeTask.status,
        ...updatedFields
      };
      
      // Convert null values to undefined for API compatibility
      const updateData = {
        ...mergedData,
        description: mergedData.description || undefined,
        project: mergedData.project || undefined,
        assignee: mergedData.assignee || undefined,
        dueDate: mergedData.dueDate || undefined,
        waitUntil: mergedData.waitUntil || undefined,
      };
      
      await taskService.updateTask(activeTask.id, updateData);
      fetchTasks();
    } catch (e) {
      console.error('Error updating task:', e);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  // Simplified task action handlers using the new hook
  const handleMarkDone = markDone;
  const handleUnmarkDone = unmarkDone;
  
  const handleLinkTask = (_task: Task) => {
    // Implement task linking functionality
    // You could open a dialog to select which task to link to
  };
  
  const handleDeleteTask = deleteTask;

  const handleSaveTask = async (updatedTask: Task) => {
    await updateTask(updatedTask, updatedTask);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Eisenhower Matrix
        </Typography>
        <Typography>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Eisenhower Matrix
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              color="primary"
            />
          }
          label="Show Completed Tasks"
        />
      </Box>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Drag tasks between quadrants to change their priority. Tasks are automatically 
          categorized based on their due date and priority.
        </Typography>
      </Paper>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={2}>
           {quadrants.map((quadrantTasks, idx) => (
             <DroppableQuadrant
               key={idx}
               quadrant={idx}
               tasks={quadrantTasks}
               title={quadrantLabels[idx].title}
               color={quadrantLabels[idx].color}
               icon={quadrantLabels[idx].icon}
               onEditTask={handleEditTask}
               onMarkDone={handleMarkDone}
               onUnmarkDone={handleUnmarkDone}
               onDeleteTask={handleDeleteTask}
               onLinkTask={handleLinkTask}
               selectedTaskId={selectedTaskId}
               setSelectedTaskId={setSelectedTaskId}
             />
           ))}
        </Grid>
        <DragOverlay>
          {activeTask ? (
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'grabbing',
              transform: 'rotate(5deg)',
              width: '300px'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {generateTaskId(activeTask)} - {activeTask.title}
                </Typography>
              </Box>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskEditDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </Box>
  );
};

export default EisenhowerMatrix;
