import { useEffect, useState, useMemo } from 'react';
import { Card, Typography, Box, LinearProgress, useTheme, alpha, Divider, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InsightsIcon from '@mui/icons-material/Insights';
import type { SxProps, Theme } from '@mui/material';
import { taskService } from '../services/taskService';
import type { TaskDTO } from '../types';

interface ProjectOpenBreakdown { project: string; openTotal: number; pending: number; started: number; }
interface AssigneeStat { assignee: string; open: number; }
const openStatuses: TaskDTO['status'][] = ['PENDING','ACTIVE'];
interface DashboardInsightsProps { sx?: SxProps<Theme> }

const DashboardInsights = ({ sx }: DashboardInsightsProps) => {
  const theme = useTheme();
  const [tasks, setTasks] = useState<TaskDTO[]|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [showAllPeople, setShowAllPeople] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

  useEffect(()=>{ let mounted=true; setLoading(true); (async()=>{ try { const t= await taskService.getTasks(); if(mounted){ setTasks(t); } } catch(e:any){ if(mounted) setError(e?.message||'Failed to load tasks'); } finally { if(mounted) setLoading(false);} })(); return ()=>{mounted=false}; },[]);

  const { assigneesAll, projectOpenAll } = useMemo(() => {
    if(!tasks) return { assigneesAll: [] as AssigneeStat[], projectOpenAll: [] as ProjectOpenBreakdown[] };
    const projectMap = new Map<string,{ total:number; open:number; pending:number; started:number }>();
    const assigneeMap = new Map<string, number>();
    tasks.forEach(t => {
      if (t.projectName) {
        const rec = projectMap.get(t.projectName) || { total:0, open:0, pending:0, started:0 };
        rec.total += 1;
        if (openStatuses.includes(t.status)) { rec.open += 1; if (t.status === 'PENDING') rec.pending += 1; if (t.status === 'ACTIVE') rec.started += 1; }
        projectMap.set(t.projectName, rec);
      }
      if (t.assignee && openStatuses.includes(t.status)) { assigneeMap.set(t.assignee, (assigneeMap.get(t.assignee)||0)+1); }
    });
    const projectOpenAll = Array.from(projectMap.entries())
      .map(([project,v])=>({ project, openTotal:v.open, pending:v.pending, started:v.started }))
      .filter(p => p.openTotal > 0)
      .sort((a,b)=> b.openTotal - a.openTotal);
    const assigneesAll = Array.from(assigneeMap.entries())
      .map(([assignee,open])=>({ assignee, open }))
      .sort((a,b)=> b.open - a.open)
    return { assigneesAll, projectOpenAll };
  }, [tasks]);

  const visibleAssignees = showAllPeople ? assigneesAll : assigneesAll.slice(0,3);
  const visibleProjects = showAllProjects ? projectOpenAll : projectOpenAll.slice(0,3);

  // Removed donut chart per request

  return (
    <Card sx={{ display:'flex', flexDirection:'column', height:260, maxHeight:260, width:'100%', p:1.5, gap:1, overflow:'auto', ...(sx as any) }} elevation={theme.palette.mode==='dark'?2:1}>
      <Typography variant='h6' sx={{ display:'flex', alignItems:'center', gap:1 }}>
        <InsightsIcon fontSize='small' />
        Insights
      </Typography>
      {loading && <LinearProgress />}
      {error && <Typography color='error' variant='caption'>{error}</Typography>}
      {!loading && !error && tasks && (
        <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
          <Box>
            {projectOpenAll.length>3 && (
              <Box sx={{ display:'flex', justifyContent:'flex-end', mb:0.5 }}>
                <IconButton size='small' onClick={()=>setShowAllProjects(v=>!v)} aria-label={showAllProjects? 'Show fewer projects':'Show all projects'}>
                  {showAllProjects ? <ExpandLessIcon fontSize='small' /> : <ExpandMoreIcon fontSize='small' />}
                </IconButton>
              </Box>
            )}
            {/* Legend removed */}
            {projectOpenAll.length===0 && <Typography variant='caption' color='text.secondary'>No open tasks</Typography>}
            <Box sx={{ display:'flex', flexDirection:'column', gap:0.75 }}>
              {visibleProjects.map(p => {
                const total = p.openTotal || 1;
                const pctPending = (p.pending/total)*100;
                const pctStarted = (p.started/total)*100;
                return (
                  <Box key={p.project} sx={{ display:'flex', flexDirection:'column', gap:0.25 }}>
                     <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:0.5, pr:'5px' }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5, minWidth:0 }}>
                        <FolderIcon sx={{ fontSize:13, color:'text.secondary', flexShrink:0 }} />
                        <Typography variant='caption' sx={{ fontWeight:600, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', maxWidth:140 }}>{p.project}</Typography>
                      </Box>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ minWidth:38, textAlign:'right' }}>{p.openTotal} open</Typography>
                        <Typography variant='caption' sx={{ fontSize:'0.7rem', color:'#F7B801', fontWeight:500, mr:0.5 }}>P {p.pending}</Typography>
                        <Typography variant='caption' sx={{ fontSize:'0.7rem', color:'#2185D0', fontWeight:500, mr:0.5 }}>S {p.started}</Typography>
                      </Box>
                    </Box>
                     <Box sx={{ position:'relative', height:10, borderRadius:5, background: alpha(theme.palette.divider,0.3), overflow:'hidden', display:'flex', mr:0.5 }}>
                       <Box title={`Pending ${p.pending}`} sx={{ width:`${pctPending}%`, background:'#F7B801', opacity:0.9 }} />
                       <Box title={`Started ${p.started}`} sx={{ width:`${pctStarted}%`, background:'#2185D0', opacity:0.9 }} />
                     </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Divider flexItem sx={{ opacity:0.4 }} />
          <Box>
            {assigneesAll.length===0 && <Typography variant='caption' color='text.secondary'>None</Typography>}
            {assigneesAll.length>0 && (
              <Box sx={{ display:'flex', flexDirection:'column', gap:1, flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.75 }}>
                  {visibleAssignees.map(a => (
                    <Box key={a.assignee} sx={{ display:'flex', alignItems:'center', gap:.5, px:0.75, py:0.4, borderRadius:1, bgcolor: alpha(theme.palette.success.main,0.08), border:`1px solid ${alpha(theme.palette.success.main,0.25)}`, maxWidth:160 }}>
                      <PersonIcon sx={{ fontSize:15, color: theme.palette.text.secondary, flexShrink:0 }} />
                      <Typography variant='caption' sx={{ fontWeight:600, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', flexGrow:1 }}>{a.assignee}</Typography>
                      <Box aria-label={`Open tasks ${a.open}`} sx={{ minWidth:20, height:18, px:0.5, borderRadius:9, bgcolor: alpha(theme.palette.success.main,0.2), color: theme.palette.success.main, fontSize:10, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center' }}>{a.open}</Box>
                    </Box>
                  ))}
                  {assigneesAll.length>3 && (
                    !showAllPeople ? (
                      <Typography
                        variant="caption"
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline', fontWeight: 500, alignSelf:'center', px:0.75, py:0.4, borderRadius:1 }}
                        onClick={() => setShowAllPeople(true)}
                      >
                        more
                      </Typography>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline', fontWeight: 500, alignSelf:'center', px:0.75, py:0.4, borderRadius:1 }}
                        onClick={() => setShowAllPeople(false)}
                      >
                        less
                      </Typography>
                    )
                  )}
                </Box>
                {/* Donut chart removed */}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardInsights;
