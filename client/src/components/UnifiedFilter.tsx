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
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Fade,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useFilterStore } from '../stores/filterStore';

// Common filter data
const statusOptions = [
  { key: 'pending', label: 'Pending' },
  { key: 'started', label: 'Started' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' }
];

const priorityOptions = [
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

const sectionTitleSx = { 
  fontSize: '0.75rem', 
  fontWeight: 600, 
  textTransform: 'uppercase', 
  letterSpacing: '0.08em', 
  mb: 0.75, 
  opacity: 0.85 
} as const;

export type FilterLayout = 'inline' | 'bar' | 'sidebar';

interface UnifiedFilterProps {
  layout: FilterLayout;
  projects?: string[];
  assignees?: string[];
  
  // For sidebar layout
  open?: boolean;
  onClose?: () => void;
  
  // For bar layout  
  onOpenFilters?: () => void;
  filtersOpen?: boolean;
}

const UnifiedFilter: React.FC<UnifiedFilterProps> = ({
  layout,
  projects = [],
  assignees = [],
  open = false,
  onClose,
  onOpenFilters,
  filtersOpen = false
}) => {
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
    clearAll,
    getActiveCount
  } = useFilterStore();

  const [projectFilter, setProjectFilter] = React.useState('');
  const activeCount = getActiveCount();

  const filteredProjects = React.useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const q = projectFilter.toLowerCase();
    return projects.filter(p => p.toLowerCase().includes(q));
  }, [projects, projectFilter]);

  // Common search component
  const SearchInput = ({ compact = false }: { compact?: boolean }) => (
    <TextField
      size="small"
      fullWidth={!compact}
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
      sx={compact ? {
        minWidth: 200,
        maxWidth: 300,
        '& .MuiOutlinedInput-root': {
          height: 32,
          backgroundColor: 'background.paper',
        },
        '& .MuiOutlinedInput-input': {
          padding: '6px 8px',
        }
      } : {}}
    />
  );

  // Common filter chips component
  const FilterChips = ({ title, options, value, onChange, color = 'primary' }: {
    title: string;
    options: Array<{ key: string; label: string }>;
    value: any;
    onChange: (key: string) => void;
    color?: 'primary' | 'secondary' | 'info';
  }) => (
    <Box sx={{ mb: layout === 'inline' ? 2 : 2 }}>
      <Typography sx={sectionTitleSx}>{title}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {options.map(opt => {
          const active = value instanceof Set ? value.has(opt.key) : value === opt.key;
          return (
            <Chip
              key={opt.key}
              label={opt.label}
              size="small"
              onClick={() => onChange(opt.key)}
              color={active ? color : 'default'}
              variant={active ? 'filled' : 'outlined'}
              sx={{ fontWeight: 500 }}
            />
          );
        })}
      </Box>
    </Box>
  );

  // Bar layout - horizontal filter bar with chips
  if (layout === 'bar') {
    // Build chip representations for active filters
    const chips: { key: string; label: string; onDelete: () => void }[] = [];

    if (status && !['pending','all'].includes(status)) {
      chips.push({ key: `status:${status}`, label: `Status: ${status}`, onDelete: () => setStatus('pending') });
    }
    priorities.forEach(p => {
      chips.push({ key: `priority:${p}`, label: `Priority: ${p.toLowerCase()}`, onDelete: () => togglePriority(p) });
    });
    selectedAssignees.forEach(a => {
      chips.push({ key: `assignee:${a}`, label: `@${a}`, onDelete: () => toggleAssignee(a) });
    });
    selectedProjects.forEach(p => {
      chips.push({ key: `project:${p}`, label: `Project: ${p}`, onDelete: () => toggleProject(p) });
    });
    if (dueDate) {
      const labelMap: Record<string,string> = { 'today':'Today', 'tomorrow':'Tomorrow', 'this-week':'This Week', 'next-week':'Next Week', 'this-month':'This Month', 'overdue':'Overdue' };
      chips.push({ key: `due:${dueDate}`, label: `Due: ${labelMap[dueDate] || dueDate}`, onDelete: () => setDueDate(undefined) });
    }
    if (search) {
      chips.push({ key: `search`, label: `Search: "${search}"`, onDelete: () => setSearch('') });
    }

    return (
      <Fade in timeout={200}>
        <Box sx={{ display: 'flex', alignItems: 'stretch', width: '100%', minHeight: 48 }}>
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 1, 
            px: 1.25, 
            py: 1, 
            borderRadius: 1, 
            bgcolor: (t) => t.palette.action.hover, 
            border: (t)=>`1px solid ${t.palette.divider}`, 
            overflow: 'hidden' 
          }}>
            <SearchInput compact />
            
            {chips.length === 0 && !search && (
              <Chip size="small" label="No filters applied" variant="outlined" sx={{ opacity: 0.7 }} />
            )}
            {chips.map(chip => (
              <Chip
                key={chip.key}
                size="small"
                label={chip.label}
                onDelete={chip.onDelete}
                variant="filled"
                color="primary"
                sx={{ fontWeight: 500 }}
              />
            ))}
            {(chips.length > 0 || search) && (
              <Tooltip title="Reset all filters">
                <Button size="small" onClick={clearAll} sx={{ ml: 'auto', textTransform: 'none', fontWeight: 600 }} variant="text" color="inherit">
                  Reset
                </Button>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
            <Tooltip title={filtersOpen ? 'Filters open' : 'Open filters'}>
              <span>
                <IconButton size="small" onClick={onOpenFilters} color={filtersOpen ? 'primary' : 'default'} aria-label="Open filters" sx={{ mr: 0.5 }}>
                  <Badge color="error" overlap="circular" badgeContent={activeCount > 0 ? (activeCount > 99 ? '99+' : activeCount) : undefined}>
                    <FilterListIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Fade>
    );
  }

  // Common filter content for inline and sidebar layouts
  const FilterContent = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      height: layout === 'inline' ? '100%' : 'auto',
      overflowY: layout === 'inline' ? 'auto' : 'visible',
      p: layout === 'inline' ? 1 : 0
    }}>
      {/* Search */}
      <Box>
        <Typography sx={sectionTitleSx}>Search</Typography>
        <SearchInput />
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

      <FilterChips
        title="Status"
        options={statusOptions}
        value={status}
        onChange={(key) => setStatus(key as any)}
        color="primary"
      />

      <FilterChips
        title="Priority"
        options={priorityOptions}
        value={priorities}
        onChange={(key) => togglePriority(key as any)}
        color="secondary"
      />

      <FilterChips
        title="Due Date"
        options={dueDateOptions}
        value={dueDate}
        onChange={(key) => setDueDate(dueDate === key ? undefined : key)}
        color="info"
      />


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
    </Box>
  );

  // Inline layout - compact filter panel
  if (layout === 'inline') {
    return <FilterContent />;
  }

  // Sidebar layout - drawer with comprehensive filters
  if (layout === 'sidebar') {
    const drawerWidth = 320;
    
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
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose} aria-label="Close filters">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 1.5, pb: 2.25, px: 2.5 }}>
          <FilterContent />
        </Box>
      </Box>
    );

    return (
      <Drawer
        variant="temporary"
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
  }

  return null;
};

export default UnifiedFilter;