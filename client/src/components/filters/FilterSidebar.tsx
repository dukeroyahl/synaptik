import React from 'react';
import { Box, Typography, Divider, Collapse, Chip, Stack } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useUiStore } from '../../stores/uiStore';
import { Task } from '../../types';

// Basic option type for future generic facet components
interface FacetOption<T = string> {
  value: T;
  label: string;
  count?: number;
}

interface SectionProps {
  title: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, initiallyOpen = true, children }) => {
  const [open, setOpen] = React.useState(initiallyOpen);
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpen(o => !o)}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>{title}</Typography>
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Collapse>
      <Divider sx={{ mt: 2, opacity: 0.4 }} />
    </Box>
  );
};

// Placeholder status facet using existing filterState
const StatusFacet: React.FC = () => {
  const { filterState, setFilter } = useUiStore();
  const active = filterState.status || [];
  const statuses: FacetOption<Task['status']>[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'STARTED', label: 'Started' },
    { value: 'COMPLETED', label: 'Completed' },
  ];
  const toggle = (val: Task['status']) => {
    const next = active.includes(val) ? active.filter(v => v !== val) : [...active, val];
    setFilter({ status: next.length ? next : undefined });
  };
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {statuses.map(s => (
        <Chip
          key={s.value}
          size="small"
          label={s.label}
          onClick={() => toggle(s.value)}
          color={active.includes(s.value) ? 'primary' : 'default'}
          variant={active.includes(s.value) ? 'filled' : 'outlined'}
          sx={{ borderRadius: 16, px: 0.5 }}
        />
      ))}
    </Stack>
  );
};

// New facet that derives unique values from tasks in store counts (fallback manual fetch later if needed)
const AssigneeFacet: React.FC = () => {
  const { filterState, setFilter } = useUiStore();
  const selected = (filterState.assignee || []) as string[];
  const [values, setValues] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then((data: any) => {
      const arr: any[] = Array.isArray(data) ? data : (data?.data || []);
      const unique = Array.from(new Set(arr.map((t: any) => t.assignee).filter((v: any): v is string => !!v)));
      // Add "No Assignee" as a special option
      setValues(['(No Assignee)', ...unique as string[]]);
    }).catch(()=>{});
  }, []);

  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
    setFilter({ assignee: next.length ? next : undefined });
  };

  if (!values.length) return <Typography variant="caption" color="text.secondary">No assignees</Typography>;
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {values.map(v => (
        <Chip key={v} size="small" label={v} onClick={() => toggle(v)} color={selected.includes(v) ? 'primary' : 'default'} variant={selected.includes(v) ? 'filled' : 'outlined'} sx={{ borderRadius: 16, px: 0.5 }} />
      ))}
    </Stack>
  );
};

const ProjectFacet: React.FC = () => {
  const { filterState, setFilter } = useUiStore();
  const selectedProject = filterState.project;
  const [projects, setProjects] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then((data: any) => {
      const arr: any[] = Array.isArray(data) ? data : (data?.data || []);
      const names = Array.from(new Set(arr.map((p: any) => p.name).filter((v: any): v is string => !!v)));
      // Add "No Project" as a special option
      setProjects(['(No Project)', ...names as string[]]);
    }).catch(()=>{});
  }, []);

  const toggle = (name: string) => {
    setFilter({ project: selectedProject === name ? undefined : name });
  };

  if (!projects.length) return <Typography variant="caption" color="text.secondary">No projects</Typography>;
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {projects.map(p => (
        <Chip key={p} size="small" label={p} onClick={() => toggle(p)} color={selectedProject === p ? 'secondary' : 'default'} variant={selectedProject === p ? 'filled' : 'outlined'} sx={{ borderRadius: 16, px: 0.5 }} />
      ))}
    </Stack>
  );
};

const PriorityFacet: React.FC = () => {
  const { filterState, setFilter } = useUiStore();
  const active = filterState.priority || [];
  const priorities: FacetOption[] = [
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'NONE', label: 'None' },
  ];
  const toggle = (val: string) => {
    const next = active.includes(val as any) ? active.filter((v: any) => v !== val) : [...active, val];
    setFilter({ priority: next.length ? (next as any) : undefined });
  };
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {priorities.map(p => (
        <Chip
          key={p.value}
          size="small"
          label={p.label}
          onClick={() => toggle(p.value)}
          color={active.includes(p.value as any) ? 'secondary' : 'default'}
          variant={active.includes(p.value as any) ? 'filled' : 'outlined'}
          sx={{ borderRadius: 16, px: 0.5 }}
        />
      ))}
    </Stack>
  );
};

interface FilterSidebarProps {
  width?: number;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ width = 300 }) => {
  const { clearFilters, filterState } = useUiStore();
  const hasFilters = Object.keys(filterState).length > 0;

  return (
    <Box
      component="aside"
      sx={{
        width,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: theme => `1px solid ${theme.palette.divider}`,
        background: theme => theme.palette.background.paper,
        p: 2,
        gap: 1,
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        maxHeight: '100vh',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FilterListIcon fontSize="small" />
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600, flexGrow: 1 }}>Filters</Typography>
        {hasFilters && (
          <Chip size="small" label="Clear" onClick={clearFilters} variant="outlined" />
        )}
      </Box>

      <Section title="Status">
        <StatusFacet />
      </Section>
      <Section title="Priority">
        <PriorityFacet />
      </Section>
      <Section title="Assignees">
        <AssigneeFacet />
      </Section>
      <Section title="Projects">
        <ProjectFacet />
      </Section>
      {/* Future sections: Urgency, Date Range, Tags */}
    </Box>
  );
};

export default FilterSidebar;
