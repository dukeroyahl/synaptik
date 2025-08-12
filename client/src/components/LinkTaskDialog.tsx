import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { TaskDTO } from '../types';
import TaskDependencySelector from './TaskDependencySelector';

interface LinkTaskDialogProps {
  open: boolean;
  task: TaskDTO | null;
  onClose: () => void;
  onSave: (taskId: string, dependencies: string[]) => void;
}

const LinkTaskDialog: React.FC<LinkTaskDialogProps> = ({
  open,
  task,
  onClose,
  onSave,
}) => {
  const [selectedDependencies, setSelectedDependencies] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (task) {
      setSelectedDependencies(task.depends || []);
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      onSave(task.id, selectedDependencies);
    }
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Link Task: {task.title}</DialogTitle>
      <DialogContent>
        <TaskDependencySelector
          taskId={task.id}
          dependencies={selectedDependencies}
          onChange={setSelectedDependencies}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkTaskDialog;
