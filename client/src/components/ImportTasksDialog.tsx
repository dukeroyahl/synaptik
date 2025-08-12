import React, { useState, useRef } from 'react';
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
  alpha,
  Box,
  Input
} from '@mui/material';
import { CloudUpload as ImportIcon, AttachFile as FileIcon } from '@mui/icons-material';
import { taskService } from '../services/taskService';

interface ImportTasksDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportTasksDialog: React.FC<ImportTasksDialogProps> = ({ 
  open, 
  onClose, 
  onImportComplete 
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setResult({
        success: false,
        message: 'Please select a file to import',
        count: 0
      });
      return;
    }

    setImporting(true);
    setResult(null);
    
    try {
      const response = await taskService.importTasks(selectedFile);
      setResult(response);
      
      if (response.success) {
        onImportComplete();
      }
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
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
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
        <ImportIcon color="primary" />
        Import Tasks
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Import tasks from a JSON file. The file should contain an array of task objects in the expected format.
        </Typography>

        <Box sx={{ 
          border: `2px dashed ${theme.palette.divider}`,
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          mb: 3,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05)
          }
        }} onClick={handleSelectFile}>
          <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            {selectedFile ? selectedFile.name : 'Click to select a file'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported format: JSON
          </Typography>
        </Box>

        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".json"
          sx={{ display: 'none' }}
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
          disabled={importing || !selectedFile}
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
