import { useEffect, useState, useMemo } from 'react';
import { Card, Typography, Box, useTheme, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { SxProps, Theme } from '@mui/material';
import { taskService } from '../services/taskService';
import type { TaskDTO } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendDatum {
  bucket: string; // e.g. 'Jan 2025' or 'Q1 2025'
  created: number;
  due: number;
  cumulativeCreated: number;
  cumulativeDue: number;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
const quarterKey = (d: Date) => {
  const q = Math.floor(d.getMonth()/3) + 1;
  return `${d.getFullYear()}-Q${q}`; // YYYY-Qn
};
const monthLabel = (key: string) => {
  const [,m] = key.split('-');
  const date = new Date(2000, Number(m)-1, 1); // year irrelevant
  return date.toLocaleString(undefined, { month: 'short' });
};
const quarterLabel = (key: string) => {
  const [,q] = key.split('-Q');
  return `Q${q}`;
};

interface TaskTrendChartProps { sx?: SxProps<Theme> }

const TaskTrendChart = ({ sx }: TaskTrendChartProps) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<TaskDTO[] | null>(null);
  // Always show full 12‑month window (current year) so period selector removed
  const [scale, setScale] = useState<'monthly'|'quarterly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const all = await taskService.getTasks();
        if (mounted) {
          setTasks(all);
          setError(undefined);
        }
      } catch (e:any) {
        if (mounted) setError(e?.message || 'Failed to load tasks');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const data: TrendDatum[] = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    // Full current calendar year
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 1); // December start
    const end = scale === 'monthly' ? yearEnd : new Date(now.getFullYear(), 11, 1);
    const start = yearStart;

    if (scale === 'monthly') {
      const buckets: string[] = [];
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        buckets.push(monthKey(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      const createdMap: Record<string, number> = {};
      const dueMap: Record<string, number> = {};
      for (const t of tasks) {
        if (t.createdAt) {
          const d = new Date(t.createdAt);
          const key = monthKey(d);
          if (key >= buckets[0] && key <= buckets[buckets.length -1]) {
            createdMap[key] = (createdMap[key] || 0) + 1;
          }
        }
        if (t.dueDate) {
          const d2 = new Date(t.dueDate);
          const key2 = monthKey(d2);
          if (key2 >= buckets[0] && key2 <= buckets[buckets.length -1]) {
            dueMap[key2] = (dueMap[key2] || 0) + 1;
          }
        }
      }
      let cumulativeCreated = 0, cumulativeDue = 0;
      return buckets.map(b => {
        const created = createdMap[b] || 0;
        const due = dueMap[b] || 0;
        cumulativeCreated += created;
        cumulativeDue += due;
        return {
          bucket: monthLabel(b),
          created,
          due,
            cumulativeCreated,
            cumulativeDue
        };
      });
    } else { // quarterly
      const quarterBuckets: string[] = [];
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        const key = quarterKey(cursor);
        if (quarterBuckets[quarterBuckets.length-1] !== key) quarterBuckets.push(key);
        cursor.setMonth(cursor.getMonth() + 1);
      }
      const createdMap: Record<string, number> = {};
      const dueMap: Record<string, number> = {};
      for (const t of tasks) {
        if (t.createdAt) {
          const d = new Date(t.createdAt);
          const key = quarterKey(d);
          if (key >= quarterBuckets[0] && key <= quarterBuckets[quarterBuckets.length -1]) {
            createdMap[key] = (createdMap[key] || 0) + 1;
          }
        }
        if (t.dueDate) {
          const d2 = new Date(t.dueDate);
          const key2 = quarterKey(d2);
          if (key2 >= quarterBuckets[0] && key2 <= quarterBuckets[quarterBuckets.length -1]) {
            dueMap[key2] = (dueMap[key2] || 0) + 1;
          }
        }
      }
      let cumulativeCreated = 0, cumulativeDue = 0;
      return quarterBuckets.map(q => {
        const created = createdMap[q] || 0;
        const due = dueMap[q] || 0;
        cumulativeCreated += created;
        cumulativeDue += due;
        return {
          bucket: quarterLabel(q),
          created,
          due,
          cumulativeCreated,
          cumulativeDue
        };
      });
    }
  }, [tasks, scale]);

  const paletteCreated = theme.palette.primary.main;
  const paletteDue = theme.palette.warning.main;

  return (
  <Card sx={{ height: 260, width: '100%', display: 'flex', flexDirection: 'column', p: 2, ...(sx as any) }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <TrendingUpIcon fontSize="small" />
          Trend
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={scale}
          onChange={(_, v) => v && setScale(v)}
        >
          <ToggleButton value='monthly'>Monthly</ToggleButton>
          <ToggleButton value='quarterly'>Quarterly</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {loading && <Box sx={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><CircularProgress size={24} /></Box>}
      {error && !loading && <Typography color='error' variant='body2'>{error}</Typography>}
      {!loading && !error && (
  <Box sx={{ flex:1, minHeight:180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={paletteCreated} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={paletteCreated} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={paletteDue} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={paletteDue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="bucket" fontSize={11} tickMargin={4} interval={0} angle={0} height={scale==='monthly'?30:25} />
              <YAxis fontSize={11} width={32} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="created" stroke={paletteCreated} fill="url(#createdFill)" name="Created" strokeWidth={2} />
              <Area type="monotone" dataKey="due" stroke={paletteDue} fill="url(#dueFill)" name="Due" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Card>
  );
};

export default TaskTrendChart;
