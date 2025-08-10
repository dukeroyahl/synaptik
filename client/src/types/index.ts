export interface Task {
  id: string
  title: string
  description?: string | null
  status: 'PENDING' | 'STARTED' | 'COMPLETED' | 'DELETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  urgency?: number | null
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
