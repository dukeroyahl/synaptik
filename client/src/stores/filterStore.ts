import { create } from 'zustand';
import { Task } from '../types';

interface FilterStoreState {
  statuses: Set<Task['status']>;
  status: 'pending' | 'active' | 'completed' | 'overdue' | 'all';
  overviewMode?: 'open' | 'closed' | 'today' | 'overdue' | null; // exclusive overview selection
  priorities: Set<Task['priority']>;
  assignees: Set<string>;
  projects: Set<string>;
  search: string;
  dueDate?: string;
  assigneeCounts: Map<string, number>;
  projectCounts: Map<string, number>;
  toggleStatus: (s: Task['status']) => void;
  setStatus: (s: FilterStoreState['status']) => void;
  setOverviewMode: (m: FilterStoreState['overviewMode']) => void;
  togglePriority: (p: Task['priority']) => void;
  toggleAssignee: (a: string) => void;
  toggleProject: (p: string) => void;
  setSearch: (q: string) => void;
  setDueDate: (d?: string) => void;
  clearAll: () => void;
  getQueryParams: () => Record<string, any>;
  getActiveCount: () => number;
  setCountsFromTasks: (tasks: Task[]) => void;
  decrementCountsForTask: (task: Task) => void;
  incrementCountsForTask: (task: Task) => void;
}

export const useFilterStore = create<FilterStoreState>((set, get) => ({
  statuses: new Set<Task['status']>(),
  status: 'all',
  overviewMode: null, // No default overview mode - let user select
  priorities: new Set<Task['priority']>(),
  assignees: new Set<string>(),
  projects: new Set<string>(),
  search: '',
  dueDate: undefined, // No default date filter - show all tasks
  assigneeCounts: new Map<string, number>(),
  projectCounts: new Map<string, number>(),
  toggleStatus: (s) => set(state => {
    const next = new Set(state.statuses);
    next.has(s) ? next.delete(s) : next.add(s);
    return { statuses: next, overviewMode: null }; // disable overview when granular filters used
  }),
  setStatus: (s) => set({ status: s, overviewMode: null }),
  setOverviewMode: (m) => set({ overviewMode: m, statuses: new Set(), priorities: new Set(), assignees: new Set(), projects: new Set(), search: '', dueDate: m === 'today' ? 'today' : m === 'overdue' ? 'overdue' : undefined }),
  togglePriority: (p) => set(state => {
    const next = new Set(state.priorities);
    next.has(p) ? next.delete(p) : next.add(p);
    return { priorities: next, overviewMode: null };
  }),
  toggleAssignee: (a) => set(state => {
    const next = new Set(state.assignees);
    next.has(a) ? next.delete(a) : next.add(a);
    return { assignees: next, overviewMode: null };
  }),
  toggleProject: (p) => set(state => {
    const next = new Set(state.projects);
    next.has(p) ? next.delete(p) : next.add(p);
    return { projects: next, overviewMode: null };
  }),
  setSearch: (q) => set({ search: q, overviewMode: null }),
  setDueDate: (d) => set({ dueDate: d || undefined, overviewMode: null }),
  clearAll: () => set({ 
    statuses: new Set(), 
    status: 'pending', 
    priorities: new Set(), 
    assignees: new Set(), 
    projects: new Set(), 
    search: '', 
    dueDate: undefined, 
    overviewMode: null
  }),
  getQueryParams: () => {
    const { overviewMode, statuses, status, priorities, assignees, projects, search, dueDate } = get();
    const statusMap: Record<string, string | undefined> = {
      pending: 'PENDING',
      active: 'ACTIVE',
      completed: 'COMPLETED',
      overdue: undefined,
      all: undefined
    };
    // Overview overrides granular selection
    if (overviewMode) {
      if (overviewMode === 'open') return { statuses: ['PENDING','ACTIVE'] };
      if (overviewMode === 'closed') return { statuses: ['COMPLETED'] };
      if (overviewMode === 'today') return { dueDate: 'today' };
      if (overviewMode === 'overdue') return { dueDate: 'overdue' };
    }
    return {
      status: statusMap[status] || undefined,
      statuses: statuses.size ? Array.from(statuses) : undefined,
      priority: priorities.size ? Array.from(priorities) : undefined,
      assignee: assignees.size ? Array.from(assignees) : undefined,
      project: projects.size ? Array.from(projects) : undefined,
      dueDate: dueDate,
      search: search || undefined
    };
  },
  getActiveCount: () => {
    const { overviewMode, statuses, status, priorities, assignees, projects, search, dueDate } = get();
    if (overviewMode) return 1; // single chip active
    let count = 0;
    if (statuses.size) count += statuses.size;
    if (status && !['pending','all'].includes(status)) count += 1;
    if (priorities.size) count += priorities.size;
    if (assignees.size) count += assignees.size;
    if (projects.size) count += projects.size;
    if (search) count += 1;
    if (dueDate) count += 1;
    return count;
  },
  setCountsFromTasks: (tasks) => set(() => {
    const aCounts = new Map<string, number>();
    const pCounts = new Map<string, number>();
    let noAssigneeCount = 0;
    let noProjectCount = 0;
    
    tasks.forEach(t => {
      if (t.assignee) {
        aCounts.set(t.assignee, (aCounts.get(t.assignee) || 0) + 1);
      } else {
        noAssigneeCount++;
      }
      
      if (t.project) {
        pCounts.set(t.project, (pCounts.get(t.project) || 0) + 1);
      } else {
        noProjectCount++;
      }
    });
    
    // Add counts for special "No" options
    if (noAssigneeCount > 0) {
      aCounts.set('(No Assignee)', noAssigneeCount);
    }
    if (noProjectCount > 0) {
      pCounts.set('(No Project)', noProjectCount);
    }
    
    return { assigneeCounts: aCounts, projectCounts: pCounts };
  }),
  decrementCountsForTask: (task) => set(state => {
    const aCounts = new Map(state.assigneeCounts);
    const pCounts = new Map(state.projectCounts);
    
    if (task.assignee && aCounts.has(task.assignee)) {
      const next = Math.max(0, (aCounts.get(task.assignee) || 0) - 1);
      next === 0 ? aCounts.delete(task.assignee) : aCounts.set(task.assignee, next);
    } else if (!task.assignee && aCounts.has('(No Assignee)')) {
      const next = Math.max(0, (aCounts.get('(No Assignee)') || 0) - 1);
      next === 0 ? aCounts.delete('(No Assignee)') : aCounts.set('(No Assignee)', next);
    }
    
    if (task.project && pCounts.has(task.project)) {
      const next = Math.max(0, (pCounts.get(task.project) || 0) - 1);
      next === 0 ? pCounts.delete(task.project) : pCounts.set(task.project, next);
    } else if (!task.project && pCounts.has('(No Project)')) {
      const next = Math.max(0, (pCounts.get('(No Project)') || 0) - 1);
      next === 0 ? pCounts.delete('(No Project)') : pCounts.set('(No Project)', next);
    }
    
    return { assigneeCounts: aCounts, projectCounts: pCounts };
  }),
  incrementCountsForTask: (task) => set(state => {
    const aCounts = new Map(state.assigneeCounts);
    const pCounts = new Map(state.projectCounts);
    
    if (task.assignee) {
      aCounts.set(task.assignee, (aCounts.get(task.assignee) || 0) + 1);
    } else {
      aCounts.set('(No Assignee)', (aCounts.get('(No Assignee)') || 0) + 1);
    }
    
    if (task.project) {
      pCounts.set(task.project, (pCounts.get(task.project) || 0) + 1);
    } else {
      pCounts.set('(No Project)', (pCounts.get('(No Project)') || 0) + 1);
    }
    
    return { assigneeCounts: aCounts, projectCounts: pCounts };
  })
}));
