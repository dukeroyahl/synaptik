import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, Chip, Button, Checkbox, FormControlLabel, alpha, useTheme, Slider, TextField, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { useFilterStore } from '../stores/filterStore';

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  permanent?: boolean;
  projects?: string[];
  assignees?: string[];
}

const sectionTitleSx = { fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75, opacity: 0.85 } as const;

const FilterSidebar: React.FC<FilterSidebarProps> = ({ open, onClose, permanent = false, projects = [], assignees = [] }) => {
  const theme = useTheme();
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

  const drawerWidth = 320;
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

  // Show all projects & assignees (no pagination/toggle)
  const [projectFilter, setProjectFilter] = React.useState('');
  const filteredProjects = React.useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const q = projectFilter.toLowerCase();
    return projects.filter(p => p.toLowerCase().includes(q));
  }, [projects, projectFilter]);

  const content = (
    <Box sx={{ width: drawerWidth, display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ py: 1.25, px: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Filters {activeCount ? `(${activeCount})` : ''}</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {activeCount > 0 && (
            <Tooltip title="Reset all filters (applies instantly)">
              <Button size="small" variant="text" onClick={clearAll} sx={{ textTransform: 'none', fontWeight: 500, px: 1 }}>
                Reset
              </Button>
            </Tooltip>
          )}
          {!permanent && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} aria-label="Close filters">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 1.5, pb: 2.25, px: 2.5 }}>
        {/* Search */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={sectionTitleSx}>Search</Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} /> }}
          />
        </Box>

        {/* Status */}
        <Box sx={{ mb: 2 }}>
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
        <Box sx={{ mb: 2 }}>
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

        {/* Due Date (moved up above Projects) */}
        <Box sx={{ mb: 2 }}>
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
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <Typography sx={sectionTitleSx}>Urgency</Typography>
            {urgencyRange && (
              <Typography
                variant="caption"
                onClick={() => setUrgencyRange(undefined)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUrgencyRange(undefined); } }}
                tabIndex={0}
                sx={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.65rem',
                  letterSpacing: 0.5,
                  opacity: 0.7,
                  userSelect: 'none',
                  ml: 1,
                  '&:hover': { opacity: 1 },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 0.5 }
                }}
                aria-label="Clear urgency range filter"
              >
                Clear
              </Typography>
            )}
          </Box>
          <Typography variant="caption" sx={{ ml: 0.5, opacity: 0.7, display: 'block', mb: 0.5 }}>
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
            // value labels disabled (numbers visible already)
            valueLabelDisplay="off"
            sx={{
              mt: 0.5,
              width: '100%',
              ml: 0,
              mr: 0,
               '& .MuiSlider-markLabel': {
                 fontSize: '0.7rem',
                 fontWeight: 500,
                 color: 'text.secondary'
               }
            }}
          />
        </Box>

        {/* Projects (all, below urgency) */}
        {projects.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={sectionTitleSx}>Projects</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Filter projects..."
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {filteredProjects.map(p => {
                 const active = selectedProjects.has(p);
                 const count = useFilterStore.getState().projectCounts.get(p) || 0;
                 return (
                   <FormControlLabel
                     key={p}
                     control={<Checkbox size="small" checked={active} onChange={() => toggleProject(p)} />}
                     label={<Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: count === 0 ? 0.45 : 1 }}>{p}{count !== undefined ? ` (${count})` : ''}</Typography>}
                   />
                 );
               })}
              {filteredProjects.length === 0 && (
                <Typography variant="caption" sx={{ opacity: 0.6, pl: 0.5, py: 0.5 }}>No matches</Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Assignees (all, below urgency) */}
        {assignees.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={sectionTitleSx}>Assignees</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {assignees.map(a => {
                const active = selectedAssignees.has(a);
                const count = useFilterStore.getState().assigneeCounts.get(a) || 0;
                return (
                  <FormControlLabel
                    key={a}
                    control={<Checkbox size="small" checked={active} onChange={() => toggleAssignee(a)} />}
                    label={<Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: count === 0 ? 0.45 : 1 }}>{a}{count !== undefined ? ` (${count})` : ''}</Typography>}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', opacity: 0.7 }}>
          Changes apply instantly
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={permanent ? 'permanent' : 'temporary'}
      open={open}
      onClose={onClose}
      anchor="left"
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          overflowX: 'hidden'
        }
      }}
    >
      {content}
    </Drawer>
  );
};

export default FilterSidebar;
