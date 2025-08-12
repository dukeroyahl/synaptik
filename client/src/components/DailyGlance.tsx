import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Warning as OverdueIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useFilterStore } from '../stores/filterStore';
import { API_BASE_URL } from '../config';

interface TaskStats {
  pending: number; // raw pending from endpoint
  started: number;  // started tasks (renamed from active)
  completed: number;
  overdue: number;
  today: number;
}

interface DailyGlanceProps {
  onFilterChange?: (filter: 'pending' | 'active' | 'completed' | 'overdue' | 'all') => void;
  activeFilter?: 'pending' | 'active' | 'completed' | 'overdue' | 'all';
  onDueDateChange?: (dueDate: string | null) => void;
  activeDueDate?: string | null; // if undefined we act uncontrolled locally
  fullHeight?: boolean; // when true stretch card to parent container height
  refreshCounter?: number; // trigger for refreshing stats when tasks change
}

const DailyGlance: React.FC<DailyGlanceProps> = ({ 
  onFilterChange,
  activeFilter = 'pending',
  onDueDateChange,
  activeDueDate,
  fullHeight = false,
  refreshCounter
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const setOverviewMode = useFilterStore(s => s.setOverviewMode);
  const [stats, setStats] = useState<TaskStats>({
    pending: 0,
    started: 0,
    completed: 0,
    overdue: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  // Local fallback when parent does not control due date state
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const effectiveDueDate = activeDueDate !== undefined ? activeDueDate : localDueDate;

  useEffect(() => { fetchStats(); }, []);
  
  // Refresh stats when tasks change
  useEffect(() => {
    if (refreshCounter !== undefined) {
      fetchStats();
    }
  }, [refreshCounter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const [pendingRes, startedRes, completedRes, overdueRes, todayRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks/search?status=PENDING`),
        fetch(`${API_BASE_URL}/api/tasks/search?status=ACTIVE`),
        fetch(`${API_BASE_URL}/api/tasks/search?status=COMPLETED`),
        fetch(`${API_BASE_URL}/api/tasks/search?status=PENDING&status=ACTIVE&dateTo=${yesterday}&tz=${tz}`),
        fetch(`${API_BASE_URL}/api/tasks/search?status=PENDING&status=ACTIVE&dateFrom=${today}&dateTo=${today}&tz=${tz}`)
      ]);
      const [pendingArr, startedArr, completedArr, overdueArr, todayArr] = await Promise.all([
        pendingRes.json(), startedRes.json(), completedRes.json(), overdueRes.json(), todayRes.json()
      ]);
      
      // Debug logging
      if (import.meta.env.DEV) {
        console.log('DailyGlance API responses:', {
          pending: pendingArr,
          started: startedArr,
          completed: completedArr,
          overdue: overdueArr,
          today: todayArr
        });
        console.log('Today query URL:', `${API_BASE_URL}/api/tasks/search?status=PENDING&status=ACTIVE&dateFrom=${today}&dateTo=${today}&tz=${tz}`);
        console.log('Date format used:', { today, tz });
      }
      
      const safeLen = (v: any) => Array.isArray(v) ? v.length : 0;
      setStats({
        pending: safeLen(pendingArr),
        started: safeLen(startedArr),
        completed: safeLen(completedArr),
        overdue: safeLen(overdueArr),
        today: safeLen(todayArr)
      });
    } catch (e) {
      console.error('Failed to fetch task stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = stats.pending + stats.started + stats.completed;
  const completionPercentage = totalTasks > 0 ? Math.round((stats.completed / totalTasks) * 100) : 0;

  const [animatedCompletion, setAnimatedCompletion] = useState(0);
  useEffect(() => {
    let frame: number;
    const startVal = animatedCompletion;
    const target = completionPercentage;
    if (startVal === target) return;
    const duration = 800;
    let startTime: number | null = null;
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const animate = (ts: number) => {
      if (startTime == null) startTime = ts;
      const raw = (ts - startTime) / duration;
      const clamped = raw > 1 ? 1 : raw;
      const eased = easeInOut(clamped);
      const value = startVal + (target - startVal) * eased;
      setAnimatedCompletion(Math.round(value));
      if (clamped < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [completionPercentage]);

  return (
    <Box sx={{ mb: fullHeight ? 0 : 3, height: fullHeight ? '100%' : 'auto' }}>
      <Card
        elevation={1}
        sx={{
          height: { xs: 'auto', sm: 260 },
          minHeight: { xs: 240, sm: 260 },
          width: '100%',
          maxWidth: '100%',
          background: isDarkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
            : theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '7px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: theme.ds?.elevation[1],
          transition: `box-shadow ${theme.ds?.motion.duration.normal}ms ${theme.ds?.motion.easing.standard}`,
          '&:hover': { boxShadow: theme.ds?.elevation[2] },
          boxSizing: 'border-box'
        }}
        className="translucent-surface"
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg,
              ${theme.palette.error.main} 0%,
              ${theme.palette.warning.main} 33%,
              ${theme.palette.info.main} 66%,
              ${theme.palette.success.main} 100%)`
          }}
        />
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pr: { xs: 1, sm: 1.25 }, pb: { xs: 1, sm: 1 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon fontSize="small" />
            Overview
          </Typography>
          {loading ? (
            <LinearProgress sx={{ my: 2 }} />
          ) : (
            <>
              <Box sx={{
                mb: { xs: 1, sm: 1.25 },
                display: 'grid',
                gap: { xs: 1, sm: 1.5 },
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gridTemplateRows: { xs: 'repeat(3, 1fr)', sm: 'repeat(2, 1fr)' },
              }}>
                {([
                  { key: 'pending', label: 'Pending', value: stats.pending, color: theme.palette.text.secondary, icon: <PendingIcon fontSize="small" /> },
                  { key: 'active', label: 'Active', value: stats.started, color: '#FFA726', icon: <TimeIcon fontSize="small" /> },
                  { key: 'completed', label: 'Completed', value: stats.completed, color: theme.palette.success.main, icon: <CompletedIcon fontSize="small" /> },
                  { key: 'overdue', label: 'Overdue', value: stats.overdue, color: theme.palette.error.main, icon: <OverdueIcon fontSize="small" /> },
                  { key: 'today', label: 'Today', value: stats.today, color: theme.palette.info.main, icon: <TodayIcon fontSize="small" /> }
                ]).map(item => {
                  const isToday = item.key === 'today';
                  const isOverdue = item.key === 'overdue';
                  const isStatus = item.key === 'pending' || item.key === 'active' || item.key === 'completed';
                  const isTodayActive = effectiveDueDate === 'today';
                  const isOverdueActive = effectiveDueDate === 'overdue';

                  // Active logic: status tiles by status, date tiles by dueDate
                  const active = isToday ? isTodayActive : 
                    isOverdue ? isOverdueActive : 
                    item.key === 'pending' ? activeFilter === 'pending' :
                    item.key === 'active' ? activeFilter === 'active' :
                    item.key === 'completed' ? activeFilter === 'completed' :
                    false;
                  // Removed formatValue logic since we're displaying the number directly

                  return (
                    <Box
                      key={item.key}
                      onClick={() => {
                        if (isToday) {
                          // Today + Open valid => intersection; Today + Completed valid => intersection
                          // Today + Overdue invalid (last click wins)
                          const next = isTodayActive ? null : 'today';
                          if (isOverdueActive && !isTodayActive) {
                            // switching from overdue to today
                            onDueDateChange?.('today');
                            if (activeDueDate === undefined) setLocalDueDate('today');
                            return;
                          }
                          onDueDateChange?.(next);
                          if (activeDueDate === undefined) setLocalDueDate(next);
                        } else if (isOverdue) {
                          // Overdue + Today invalid (last click wins)
                          // Overdue + Open invalid (last click wins) meaning selecting overdue should drop Open status (set status to 'all')
                          if (isTodayActive) {
                            onDueDateChange?.('overdue');
                          } else if (!isOverdueActive) {
                            onDueDateChange?.('overdue');
                          } else {
                            // toggle off overdue -> clear due date
                            onDueDateChange?.(null);
                          }
                          if (activeDueDate === undefined) setLocalDueDate(isOverdueActive ? null : 'overdue');
                          // When selecting overdue drop status to all (invalid combo with pending/active/completed per spec)
                          if (activeFilter === 'pending' || activeFilter === 'active' || activeFilter === 'completed') {
                            onFilterChange?.('all');
                          }
                        } else if (isStatus) {
                          const current = activeFilter === item.key;
                          // Status selection logic
                          if (!current) {
                            // Select the specific status
                            onFilterChange?.(item.key as 'pending' | 'active' | 'completed' | 'overdue');
                            // Clear overview mode when selecting specific status
                            setOverviewMode(null);
                            // if selecting any status while overdue active (invalid), clear overdue (last click wins)
                            if (isOverdueActive) {
                              onDueDateChange?.(null);
                              if (activeDueDate === undefined) setLocalDueDate(null);
                            }
                          } else {
                            // toggling status off -> show all
                            onFilterChange?.('all');
                          }
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        px: { xs: 1, sm: 1.4 },
                        py: { xs: 0.8, sm: 1.05 },
                        height: { xs: 60, sm: 74 },
                        borderRadius: 2,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'stretch',
                        overflow: 'hidden',
                        background: active ? alpha(item.color, 0.18) : alpha(item.color, 0.06),
                        border: `1px solid ${active ? alpha(item.color, 0.9) : alpha(item.color, 0.22)}`,
                        boxShadow: active
                          ? `${theme.ds?.elevation[2]}, inset 0 -3px 0 0 ${item.color}`
                          : theme.ds?.elevation[1],
                        transition: `all ${theme.ds?.motion.duration.normal}ms ${theme.ds?.motion.easing.standard}`,
                        '&:hover': (onFilterChange || onDueDateChange) ? {
                          background: alpha(item.color, active ? 0.22 : 0.1),
                          transform: 'translateY(-2px)',
                          boxShadow: `${theme.ds?.elevation[2]}, inset 0 -3px 0 0 ${item.color}`
                        } : {}
                      }}
                    >
                      {/* Icon as stylistic watermark */}
                      <Box sx={{ 
                        position: 'absolute',
                        top: { xs: -6, sm: -8 },
                        right: { xs: -6, sm: -8 },
                        opacity: active ? 0.15 : 0.08,
                        transform: 'rotate(15deg)',
                        transition: 'all 200ms ease',
                        '& svg': { 
                          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                          color: item.color,
                          filter: active ? `drop-shadow(0 0 8px ${alpha(item.color, 0.2)})` : 'none'
                        }
                      }}>
                        {item.icon}
                      </Box>
                      
                      {/* Number display */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <Typography
                          sx={{
                            fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                            lineHeight: 1,
                            fontWeight: 700,
                            letterSpacing: '-0.05em',
                            color: item.color,
                            textShadow: `0 0 3px ${alpha(item.color, 0.3)}`,
                            transition: 'color 160ms ease, text-shadow 160ms ease',
                            textAlign: 'center',
                            mb: { xs: 0.25, sm: 0.5 },
                            minWidth: '3ch',
                            display: 'block'
                          }}
                        >
                          {item.value.toString().padStart(2, '0')}
                        </Typography>
                        
                        {/* Label below number */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 500, 
                            color: active ? item.color : 'text.secondary', 
                            letterSpacing: 0.5,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            transition: 'color 160ms ease',
                            width: '100%', // Take full width of parent
                            display: 'block' // Ensure it's a block element for centering
                          }}
                        >
                          
                          {item.label}{isToday && isTodayActive ? ' *' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, pl: { xs: 0.1, sm: 0.2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  {animatedCompletion}% complete
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={animatedCompletion}
                  sx={{
                    flexGrow: 1,
                    height: { xs: 8, sm: 10 },
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.light || theme.palette.primary.main, 0.75)} 100%)`,
                      transition: 'width 800ms cubic-bezier(0.4,0.0,0.2,1)'
                    }
                  }}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DailyGlance;
