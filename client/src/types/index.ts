// Legacy Task interface for backward compatibility
export interface Task {
  id: string
  title: string
  description?: string | null
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  project?: string | null
  assignee?: string | null
  dueDate?: string | null
  waitUntil?: string | null
  tags: string[]
  annotations: Array<{
    timestamp: string
    description: string
  }>
  depends: string[]
  originalInput?: string | null
  createdAt: string
  updatedAt: string
}

// New API-aligned interfaces
export interface TaskDTO {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  assignee?: string
  dueDate?: string
  waitUntil?: string
  tags: string[]
  depends: string[]
  projectId?: string
  projectName?: string
  createdAt: string
  updatedAt: string
}

export interface TaskRequest {
  id?: string
  title: string
  description?: string
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELETED'
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  projectName?: string
  projectId?: string
  assignee?: string
  dueDate?: string
  waitUntil?: string
  tags?: string[]
}

export interface TaskSearchParams {
  assignee?: string
  dateFrom?: string
  dateTo?: string
  projectId?: string
  status?: ('PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELETED')[]
  title?: string
  tz?: string
}

export interface TaskGraphNode {
  id: string
  title: string
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELETED'
  projectId?: string
  assignee?: string
  priority?: string
  placeholder?: boolean
}

export interface TaskGraphEdge {
  from: string
  to: string
}

export interface TaskGraphResponse {
  centerId?: string
  nodes: TaskGraphNode[]
  edges: TaskGraphEdge[]
  hasCycles?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'DELETED'
  progress?: number
  color?: string
  startDate?: string
  endDate?: string
  dueDate?: string
  tags?: string[]
  owner?: string
  members?: string[]
  overdue?: boolean
  daysUntilDue?: number
  createdAt: string
  updatedAt: string
}

export interface UpdateProject {
  name?: string
  description?: string
  status?: 'PENDING' | 'STARTED' | 'COMPLETED' | 'DELETED'
  progress?: number
  color?: string
  startDate?: string
  endDate?: string
  dueDate?: string
  tags?: string[]
  owner?: string
  members?: string[]
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface TaskFilters {
  status?: Task['status'][]
  priority?: Task['priority'][]
  project?: string
  assignee?: string[]
  search?: string
  tags?: string[]
  dueDate?: {
    start: string
    end: string
  }
}
