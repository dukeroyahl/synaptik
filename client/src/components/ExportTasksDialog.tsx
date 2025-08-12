import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { CloudDownload as ExportIcon, GetApp as DownloadIcon } from '@mui/icons-material';
import { taskService } from '../services/taskService';

interface ExportTasksDialogProps {
  open: boolean;
  onClose: () => void;
}

const ExportTasksDialog: React.FC<ExportTasksDialogProps> = ({ 
  open, 
  onClose 
}) => {
  const theme = useTheme();
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setResult(null);
    
    try {
      const blob = await taskService.exportTasks('json');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setResult({
        success: true,
        message: 'Tasks exported successfully as JSON file'
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <ExportIcon color="success" />
        Export Tasks
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Export all your tasks to a JSON file with complete task data and metadata.
        </Typography>

        {result && (
          <Alert 
            severity={result.success ? "success" : "error"} 
            sx={{ mt: 2 }}
          >
            <AlertTitle>
              {result.success ? "Export Successful" : "Export Failed"}
            </AlertTitle>
            {result.message}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 2,
        gap: 1
      }}>
        <Button onClick={handleClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          color="success"
          disabled={exporting}
          startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
          sx={{
            background: exporting 
              ? undefined 
              : `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark} 90%)`,
            '&:hover': {
              background: exporting 
                ? undefined 
                : `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.success.main} 90%)`,
            }
          }}
        >
          {exporting ? 'Exporting...' : 'Export as JSON'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportTasksDialog;
