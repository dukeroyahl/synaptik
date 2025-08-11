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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { CloudDownload as ImportIcon } from '@mui/icons-material';

interface ImportTasksDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportTasksDialog: React.FC<ImportTasksDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [importing, setImporting] = useState(false);
  const [forceImport, setForceImport] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    
    try {
      // Backend doesn't support import functionality yet
      setResult({
        success: false,
        message: 'Import functionality is not available - backend API does not support /api/import/taskwarrior endpoint',
        count: 0
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        count: 0
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setForceImport(false);
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
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
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
        <ImportIcon color="primary" />
        Import Tasks from TaskWarrior
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Import Not Available</AlertTitle>
          The backend API does not currently support task import functionality.
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This feature would import tasks from your TaskWarrior installation, but the required API endpoint is not implemented.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={forceImport}
              onChange={(e) => setForceImport(e.target.checked)}
              disabled={true}
            />
          }
          label="Force import (overwrite existing tasks)"
          disabled={true}
        />

        {result && (
          <Alert 
            severity={result.success ? "success" : "error"} 
            sx={{ mt: 2 }}
          >
            <AlertTitle>
              {result.success ? "Import Successful" : "Import Failed"}
            </AlertTitle>
            {result.message}
            {result.success && result.count !== undefined && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Imported {result.count} tasks
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 2,
        gap: 1
      }}>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importing || true} // Always disabled since not supported
          startIcon={importing ? <CircularProgress size={16} /> : <ImportIcon />}
          sx={{
            background: importing 
              ? undefined 
              : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
            '&:hover': {
              background: importing 
                ? undefined 
                : `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
            }
          }}
        >
          {importing ? 'Importing...' : 'Import Tasks'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportTasksDialog;
