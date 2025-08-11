import { apiClient } from './apiClient'
import { Task } from '../types'
import { 
  API_ENDPOINTS, 
  getTaskEndpoint, 
  getTaskActionEndpoint
} from '../constants/api'

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
  private basePath = API_ENDPOINTS.TASKS

  async getTasks(filters?: TaskQueryParams): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(this.basePath, filters)
    return response.data
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(getTaskEndpoint(id))
    return response.data
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<Task>(this.basePath, data)
    return response.data
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<Task>(getTaskEndpoint(id), data)
    return response.data
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(getTaskEndpoint(id))
  }

  async performAction(id: string, action: TaskAction): Promise<Task> {
    // Map client actions to backend endpoints
    if (action === 'delete') {
      // Delete uses DELETE method, not POST to action endpoint
      await this.deleteTask(id)
      // Return a placeholder since delete doesn't return task data
      return {} as Task
    }
    
    const response = await apiClient.post<Task>(getTaskActionEndpoint(id, action))
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

  async captureTask(text: string, project?: string): Promise<Task> {
    // Create a task from the user-entered string with MEDIUM priority and no due date
    const taskData: CreateTaskRequest = {
      title: text.trim(),
      priority: 'MEDIUM',
      project: project,
      // dueDate is undefined (null) by default
      // description is undefined by default
    }
    
    const response = await apiClient.post<Task>(this.basePath, taskData)
    return response.data
  }

  // Filtered queries for common use cases
  async getPendingTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS_PENDING)
    return response.data
  }

  async getActiveTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS_ACTIVE)
    return response.data
  }


  async getOverdueTasks(tz?: string): Promise<Task[]> {
    const url = tz ? `${API_ENDPOINTS.TASKS_OVERDUE}?tz=${encodeURIComponent(tz)}` : API_ENDPOINTS.TASKS_OVERDUE
    const response = await apiClient.get<Task[]>(url)
    return response.data
  }

  async getTodayTasks(tz?: string): Promise<Task[]> {
    const url = tz ? `${API_ENDPOINTS.TASKS_TODAY}?tz=${encodeURIComponent(tz)}` : API_ENDPOINTS.TASKS_TODAY
    const response = await apiClient.get<Task[]>(url)
    return response.data
  }

  async getTaskDependencies(_id: string): Promise<Task[]> {
    // Backend doesn't have dependencies endpoint, return empty array
    console.warn('Task dependencies not supported by backend API')
    return []
  }

  async addDependency(taskId: string, _dependsOnId: string): Promise<Task> {
    // Backend doesn't support dependencies, return task unchanged
    console.warn('Task dependencies not supported by backend API')
    const response = await apiClient.get<Task>(getTaskEndpoint(taskId))
    return response.data
  }

  async removeDependency(taskId: string, _dependsOnId: string): Promise<Task> {
    // Backend doesn't support dependencies, return task unchanged
    console.warn('Task dependencies not supported by backend API')
    const response = await apiClient.get<Task>(getTaskEndpoint(taskId))
    return response.data
  }
}

// Singleton instance
export const taskService = new TaskService()