export interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'DELETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  urgency?: number
  project?: string
  assignee?: string
  dueDate?: string
  waitUntil?: string
  tags: string[]
  annotations: Array<{
    timestamp: string
    description: string
  }>
  depends: string[]
  originalInput?: string
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
