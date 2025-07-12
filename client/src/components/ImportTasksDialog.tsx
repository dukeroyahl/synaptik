import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
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

const ImportTasksDialog: React.FC<ImportTasksDialogProps> = ({ open, onClose, onImportComplete }) => {
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
      const response = await fetch('/api/import/taskwarrior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force: forceImport })
      });
      
      const data = await response.json();
      
      setResult({
        success: data.success,
        message: data.message,
        count: data.count
      });
      
      if (data.success) {
        // Wait a moment before closing to show success message
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error importing tasks:', error);
      setResult({
        success: false,
        message: 'Failed to connect to the server. Please try again.'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      onClose();
    }
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
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImportIcon color="primary" />
          <Typography variant="h6">Import Tasks from TaskWarrior</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" paragraph>
            This will import all your tasks from TaskWarrior into Synaptik. The import process:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li">Reads tasks from your TaskWarrior data</Typography>
            <Typography component="li">Converts them to Synaptik format</Typography>
            <Typography component="li">Preserves task relationships and attributes</Typography>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Requirements</AlertTitle>
            <Typography variant="body2">
              TaskWarrior must be installed and configured on this system.
            </Typography>
          </Alert>
          
          {result && (
            <Alert 
              severity={result.success ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              <Typography variant="body2">
                {result.message}
                {result.success && result.count !== undefined && (
                  <strong> ({result.count} tasks imported)</strong>
                )}
              </Typography>
            </Alert>
          )}
        </Box>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={forceImport}
              onChange={(e) => setForceImport(e.target.checked)}
              disabled={importing}
            />
          }
          label={
            <Typography variant="body2">
              Force import (delete existing tasks first)
            </Typography>
          }
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={importing}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={importing}
          variant="contained"
          startIcon={importing ? <CircularProgress size={20} /> : <ImportIcon />}
        >
          {importing ? 'Importing...' : 'Import Tasks'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportTasksDialog;
