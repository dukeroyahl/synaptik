import React from 'react';
import { Box, Chip, Button, Fade, Tooltip, IconButton, Badge } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useFilterStore } from '../stores/filterStore';

/**
 * Displays currently applied filters as removable chips + a quick reset button.
 */
interface ActiveFiltersBarProps {
  onOpenFilters?: () => void;
  filtersOpen?: boolean;
}

const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({ onOpenFilters, filtersOpen }) => {
  const {
    status,
    priorities,
    assignees,
    projects,
    search,
    dueDate,
    urgencyRange,
    clearAll,
    togglePriority,
    toggleAssignee,
    toggleProject,
    setSearch,
    setStatus,
    setDueDate,
    setUrgencyRange,
    getActiveCount
  } = useFilterStore();

  const activeCount = getActiveCount();

  // Build chip representations
  const chips: { key: string; label: string; onDelete: () => void }[] = [];

  if (status && !['pending','all'].includes(status)) {
    chips.push({ key: `status:${status}`, label: `Status: ${status}`, onDelete: () => setStatus('pending') });
  }
  priorities.forEach(p => {
    chips.push({ key: `priority:${p}`, label: `Priority: ${p.toLowerCase()}`, onDelete: () => togglePriority(p) });
  });
  assignees.forEach(a => {
    chips.push({ key: `assignee:${a}`, label: `@${a}`, onDelete: () => toggleAssignee(a) });
  });
  projects.forEach(p => {
    chips.push({ key: `project:${p}`, label: `Project: ${p}`, onDelete: () => toggleProject(p) });
  });
  if (dueDate) {
    const labelMap: Record<string,string> = { 'today':'Today', 'tomorrow':'Tomorrow', 'this-week':'This Week', 'next-week':'Next Week', 'this-month':'This Month', 'overdue':'Overdue' };
    chips.push({ key: `due:${dueDate}`, label: `Due: ${labelMap[dueDate] || dueDate}`, onDelete: () => setDueDate(undefined) });
  }
  if (search) {
    chips.push({ key: `search`, label: `Search: "${search}"`, onDelete: () => setSearch('') });
  }
  if (urgencyRange) {
    chips.push({ key: 'urgency', label: `Urgency: ${urgencyRange[0]}–${urgencyRange[1]}` , onDelete: () => setUrgencyRange(undefined) });
  }

  return (
    <Fade in timeout={200}>
      <Box sx={{ display: 'flex', alignItems: 'stretch', width: '100%', minHeight: 48 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 1.25, py: 1, borderRadius: 1, bgcolor: (t) => t.palette.action.hover, border: (t)=>`1px solid ${t.palette.divider}`, overflow: 'hidden' }}>
          {chips.length === 0 && (
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
          {chips.length > 0 && (
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
};

export default ActiveFiltersBar;
