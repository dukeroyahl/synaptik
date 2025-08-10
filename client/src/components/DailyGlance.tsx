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

interface TaskStats {
  pending: number; // raw pending from endpoint
  started: number;  // started tasks (renamed from active)
  waiting: number; // waiting tasks
  completed: number;
  overdue: number;
  today: number;
}

interface DailyGlanceProps {
  onFilterChange?: (filter: 'pending' | 'started' | 'waiting' | 'completed' | 'overdue' | 'all') => void;
  activeFilter?: 'pending' | 'started' | 'waiting' | 'completed' | 'overdue' | 'all';
  onDueDateChange?: (dueDate: string | null) => void;
  activeDueDate?: string | null; // if undefined we act uncontrolled locally
  fullHeight?: boolean; // when true stretch card to parent container height
}

const DailyGlance: React.FC<DailyGlanceProps> = ({ 
  onFilterChange,
  activeFilter = 'pending',
  onDueDateChange,
  activeDueDate,
  fullHeight = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [stats, setStats] = useState<TaskStats>({
    pending: 0,
    started: 0,
    waiting: 0,
    completed: 0,
    overdue: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  // Local fallback when parent does not control due date state
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const effectiveDueDate = activeDueDate !== undefined ? activeDueDate : localDueDate;

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [pendingRes, startedRes, waitingRes, completedRes, overdueRes, todayRes] = await Promise.all([
        fetch('/api/tasks/pending'),
        fetch('/api/tasks/started'),
        fetch('/api/tasks/waiting'),
        fetch('/api/tasks/completed'),
        fetch('/api/tasks/overdue'),
        fetch('/api/tasks/today')
      ]);
      const [pendingArr, startedArr, waitingArr, completedArr, overdueArr, todayArr] = await Promise.all([
        pendingRes.json(), startedRes.json(), waitingRes.json(), completedRes.json(), overdueRes.json(), todayRes.json()
      ]);
      const safeLen = (v: any) => Array.isArray(v) ? v.length : 0;
      setStats({
        pending: safeLen(pendingArr),
        started: safeLen(startedArr),
        waiting: safeLen(waitingArr),
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

  const openCount = stats.pending + stats.started + stats.waiting;
  const totalTasks = stats.pending + stats.completed;
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

  const formatValue = (value: number) => {
    if (value >= 100) {
      const str = value.toString();
      return { digits: str.split(''), padCount: 0 } as const;
    }
    const str = value.toString().padStart(2, '0');
    let padCount = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '0') padCount++; else break;
    }
    return { digits: str.split(''), padCount } as const;
  };

  return (
    <Box sx={{ mb: fullHeight ? 0 : 3, height: fullHeight ? '100%' : 'auto' }}>
      <Card
        elevation={1}
        sx={{
          height: 260,
          width: '100%',
          maxWidth: 410,
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
          '&:hover': { boxShadow: theme.ds?.elevation[2] }
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
        <CardContent sx={{ p: 2, pr: 1.25, pb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon fontSize="small" />
            Today's Overview
          </Typography>
          {loading ? (
            <LinearProgress sx={{ my: 2 }} />
          ) : (
            <>
              <Box sx={{
                mb: 1.25,
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: 'repeat(2, 1fr)',
              }}>
                {([
                  { key: 'pending', label: 'Open', value: openCount, color: theme.palette.warning.main, icon: <PendingIcon fontSize="small" /> },
                  { key: 'completed', label: 'Completed', value: stats.completed, color: theme.palette.success.main, icon: <CompletedIcon fontSize="small" /> },
                  { key: 'overdue', label: 'Overdue', value: stats.overdue, color: theme.palette.error.main, icon: <OverdueIcon fontSize="small" /> },
                  { key: 'today', label: 'Today', value: stats.today, color: theme.palette.info.main, icon: <TodayIcon fontSize="small" /> }
                ] as const).map(item => {
                  const isToday = item.key === 'today';
                  const isOverdue = item.key === 'overdue';
                  const isStatus = item.key === 'pending' || item.key === 'completed';
                  const isTodayActive = effectiveDueDate === 'today';
                  const isOverdueActive = effectiveDueDate === 'overdue';

                  // Active logic: status tiles by status, date tiles by dueDate
                  const active = isToday ? isTodayActive : isOverdue ? isOverdueActive : activeFilter === (item.key as any);
                  const { digits, padCount } = formatValue(item.value);

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
                          // When selecting overdue drop status to all (invalid combo with open/completed per spec)
                          if (activeFilter === 'pending' || activeFilter === 'completed') {
                            onFilterChange?.('all');
                          }
                        } else if (isStatus) {
                          const current = activeFilter === item.key;
                          // Open + Completed invalid -> last click wins: selecting one replaces the other
                          if (!current) {
                            onFilterChange?.(item.key as any);
                            // if selecting Open or Completed while overdue active (invalid), clear overdue (last click wins)
                            if (isOverdueActive) {
                              onDueDateChange?.(null);
                              if (activeDueDate === undefined) setLocalDueDate(null);
                            }
                          } else {
                            // toggling status off -> go to 'all'
                            onFilterChange?.('all');
                          }
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        px: 1.4,
                        py: 1.05,
                        height: 74,
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
                      <Box sx={{ flex: '0 0 auto', pr: 0.9, display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.2 }}>
                          {digits.map((d, i) => (
                            <Typography
                              key={i}
                              component="span"
                              sx={{
                                fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: { xs: '2.05rem', sm: '2.25rem' },
                                lineHeight: 1,
                                fontWeight: 700,
                                letterSpacing: '-0.05em',
                                color: i < padCount ? alpha(item.color, 0.18) : item.color,
                                textShadow: i < padCount ? 'none' : `0 0 3px ${alpha(item.color, 0.3)}`,
                                transition: 'color 160ms ease, text-shadow 160ms ease'
                              }}
                            >
                              {d}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <Box sx={{ flex: '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.1, color: active ? item.color : alpha(item.color, 0.65), '& svg': { fontSize: { xs: '1.35rem', sm: '1.45rem' }, filter: active ? `drop-shadow(0 0 4px ${alpha(item.color,0.35)})` : 'none' } }}>
                            {item.icon}
                          </Box>
                        <Box sx={{ flex: '1 1 50%', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 0.4 }}>
                          <Typography variant="caption" sx={{ fontWeight: 400, color: 'text.secondary', letterSpacing: 0.25 }}>
                            {item.label}{isToday && isTodayActive ? ' *' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, pl: 0.2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {animatedCompletion}% complete
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={animatedCompletion}
                  sx={{
                    flexGrow: 1,
                    height: 10,
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
