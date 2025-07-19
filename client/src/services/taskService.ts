import { apiClient } from './apiClient'
import { API_BASE_URL } from '../config'
import { Task } from '../types'

export type TaskAction = 'start' | 'stop' | 'done' | 'delete'

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Task['priority']
  project?: string
  assignee?: string
  dueDate?: string
  waitUntil?: string
  tags?: string[]
  depends?: string[]
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: Task['status']
}

export interface TaskQueryParams {
  status?: string | string[]
  priority?: string | string[]
  project?: string
  tags?: string | string[]
  assignee?: string
  dueBefore?: string
  dueAfter?: string
  depends?: string
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class TaskService {
  private basePath = '/api/tasks'

  async getTasks(filters?: TaskQueryParams): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(this.basePath, filters)
    return response.data
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`${this.basePath}/${id}`)
    return response.data
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<Task>(this.basePath, data)
    return response.data
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<Task>(`${this.basePath}/${id}`, data)
    return response.data
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`)
  }

  async performAction(id: string, action: TaskAction): Promise<Task> {
    const response = await apiClient.post<Task>(`${this.basePath}/${id}/${action}`)
    return response.data
  }

  async startTask(id: string): Promise<Task> {
    return this.performAction(id, 'start')
  }

  async stopTask(id: string): Promise<Task> {
    return this.performAction(id, 'stop')
  }

  async completeTask(id: string): Promise<Task> {
    return this.performAction(id, 'done')
  }

  async archiveTask(id: string): Promise<Task> {
    return this.performAction(id, 'delete')
  }

  async captureTask(text: string): Promise<Task> {
    // Use direct fetch for plain text content-type
    const response = await fetch(`${API_BASE_URL}${this.basePath}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: text
    })
    
    if (!response.ok) {
      throw new Error(`Failed to capture task: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  }

  // Filtered queries for common use cases
  async getPendingTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/pending`)
    return response.data
  }

  async getActiveTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/active`)
    return response.data
  }

  async getOverdueTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/overdue`)
    return response.data
  }

  async getTodayTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/today`)
    return response.data
  }

  async getTaskDependencies(id: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.basePath}/${id}/dependencies`)
    return response.data
  }

  async addDependency(taskId: string, dependsOnId: string): Promise<Task> {
    const response = await apiClient.post<Task>(`${this.basePath}/${taskId}/dependencies`, {
      dependsOn: dependsOnId
    })
    return response.data
  }

  async removeDependency(taskId: string, dependsOnId: string): Promise<Task> {
    const response = await apiClient.delete<Task>(`${this.basePath}/${taskId}/dependencies/${dependsOnId}`)
    return response.data
  }
}

// Singleton instance
export const taskService = new TaskService()