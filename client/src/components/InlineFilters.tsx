import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  Slider,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useFilterStore } from '../stores/filterStore';

interface InlineFiltersProps {
  projects?: string[];
  assignees?: string[];
}

const sectionTitleSx = { 
  fontSize: '0.75rem', 
  fontWeight: 600, 
  textTransform: 'uppercase', 
  letterSpacing: '0.08em', 
  mb: 0.75, 
  opacity: 0.85 
} as const;

const InlineFilters: React.FC<InlineFiltersProps> = ({ projects = [], assignees = [] }) => {
  const {
    status,
    setStatus,
    priorities,
    togglePriority,
    assignees: selectedAssignees,
    toggleAssignee,
    projects: selectedProjects,
    toggleProject,
    search,
    setSearch,
    dueDate,
    setDueDate,
    urgencyRange,
    setUrgencyRange,
    clearAll,
    getActiveCount
  } = useFilterStore();

  const [projectFilter, setProjectFilter] = React.useState('');
  const urgencyMarks = React.useMemo(() => Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) })), []);
  const activeCount = getActiveCount();

  const statusOptions: { key: any; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'started', label: 'Started' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' }
  ];

  const priorityOptions: { key: any; label: string }[] = [
    { key: 'HIGH', label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' }
  ];

  const dueDateOptions = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'this-week', label: 'This Week' },
    { key: 'next-week', label: 'Next Week' },
    { key: 'this-month', label: 'This Month' },
    { key: 'overdue', label: 'Overdue' },
  ];

  const filteredProjects = React.useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const q = projectFilter.toLowerCase();
    return projects.filter(p => p.toLowerCase().includes(q));
  }, [projects, projectFilter]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      height: '100%',
      overflowY: 'auto',
      p: 1
    }}>
      {/* Search */}
      <Box>
        <Typography sx={sectionTitleSx}>Search</Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <ClearIcon 
                  sx={{ 
                    color: 'text.secondary', 
                    fontSize: 16, 
                    cursor: 'pointer',
                    '&:hover': { color: 'text.primary' }
                  }} 
                  onClick={() => setSearch('')}
                />
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* Reset All Button */}
      {activeCount > 0 && (
        <Button 
          size="small" 
          variant="outlined" 
          onClick={clearAll} 
          fullWidth
          sx={{ textTransform: 'none', fontWeight: 500 }}
        >
          Reset All Filters ({activeCount})
        </Button>
      )}

      {/* Status */}
      <Box>
        <Typography sx={sectionTitleSx}>Status</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {statusOptions.map(opt => {
            const active = status === opt.key;
            return (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                onClick={() => setStatus(opt.key)}
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                sx={{ fontWeight: 500 }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Priority */}
      <Box>
        <Typography sx={sectionTitleSx}>Priority</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {priorityOptions.map(opt => {
            const active = priorities.has(opt.key);
            return (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                onClick={() => togglePriority(opt.key)}
                color={active ? 'secondary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                sx={{ fontWeight: 500 }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Due Date */}
      <Box>
        <Typography sx={sectionTitleSx}>Due Date</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {dueDateOptions.map(opt => {
            const active = dueDate === opt.key;
            return (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                onClick={() => setDueDate(active ? undefined : opt.key)}
                color={active ? 'info' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                sx={{ fontWeight: 500 }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Urgency Range */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={sectionTitleSx}>Urgency</Typography>
          {urgencyRange && (
            <Typography
              variant="caption"
              onClick={() => setUrgencyRange(undefined)}
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.65rem',
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              Clear
            </Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 0.5 }}>
          {(urgencyRange || [0,10])[0]} – {(urgencyRange || [0,10])[1]}
        </Typography>
        <Slider
          size="small"
          value={urgencyRange || [0, 10]}
          min={0}
          max={10}
          marks={urgencyMarks}
          step={1}
          onChange={(_, val) => setUrgencyRange(val as [number, number])}
          valueLabelDisplay="off"
          sx={{
            '& .MuiSlider-markLabel': {
              fontSize: '0.6rem',
              fontWeight: 500,
              color: 'text.secondary'
            }
          }}
        />
      </Box>

      {/* Projects */}
      {projects.length > 0 && (
        <Box>
          <Typography sx={sectionTitleSx}>Projects</Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Filter projects..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 120, overflowY: 'auto' }}>
            {filteredProjects.map(p => {
              const active = selectedProjects.has(p);
              const count = useFilterStore.getState().projectCounts.get(p) || 0;
              return (
                <FormControlLabel
                  key={p}
                  control={<Checkbox size="small" checked={active} onChange={() => toggleProject(p)} />}
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: count === 0 ? 0.45 : 1 }}>
                      {p}{count !== undefined ? ` (${count})` : ''}
                    </Typography>
                  }
                />
              );
            })}
            {filteredProjects.length === 0 && (
              <Typography variant="caption" sx={{ opacity: 0.6, pl: 0.5, py: 0.5 }}>
                No matches
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Assignees */}
      {assignees.length > 0 && (
        <Box>
          <Typography sx={sectionTitleSx}>Assignees</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxHeight: 120, overflowY: 'auto' }}>
            {assignees.map(a => {
              const active = selectedAssignees.has(a);
              const count = useFilterStore.getState().assigneeCounts.get(a) || 0;
              return (
                <FormControlLabel
                  key={a}
                  control={<Checkbox size="small" checked={active} onChange={() => toggleAssignee(a)} />}
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: count === 0 ? 0.45 : 1 }}>
                      {a}{count !== undefined ? ` (${count})` : ''}
                    </Typography>
                  }
                />
              );
            })}
          </Box>
        </Box>
      )}

      <Divider />
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', opacity: 0.7 }}>
        Changes apply instantly
      </Typography>
    </Box>
  );
};

export default InlineFilters;
