import React from 'react';
import { Box, Card, CardContent, useTheme, Divider } from '@mui/material';
import TaskCapture from './TaskCapture';
import ActiveFiltersBar from './ActiveFiltersBar';

interface CaptureFilterBarProps {
  onTaskCaptured: () => void;
  onOpenFilters: () => void;
  filtersOpen: boolean;
}

const CaptureFilterBar: React.FC<CaptureFilterBarProps> = ({ onTaskCaptured, onOpenFilters, filtersOpen }) => {
  const theme = useTheme();
  return (
    <Card elevation={theme.palette.mode === 'dark' ? 3 : 1} sx={{ mb: 2, borderRadius: 2 }} className="glass-task-container">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 280, display: 'flex', alignItems: 'stretch' }}>
            <TaskCapture onTaskCaptured={onTaskCaptured} />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ my: 0.5, display: { xs: 'none', sm: 'block' }, borderColor: theme.palette.divider, opacity: 0.4 }} />
          <Box sx={{ flex: 2, minWidth: 320, display: 'flex', alignItems: 'stretch' }}>
            <ActiveFiltersBar onOpenFilters={onOpenFilters} filtersOpen={filtersOpen} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CaptureFilterBar;
