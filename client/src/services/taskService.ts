import { apiClient } from './apiClient'
import { Task } from '../types'
import { 
  API_ENDPOINTS, 
  getTaskEndpoint, 
  getTaskActionEndpoint, 
  getTaskDependenciesEndpoint, 
  getTaskDependencyEndpoint 
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

  async captureTask(text: string): Promise<Task> {
    const response = await apiClient.post<Task>(API_ENDPOINTS.TASKS_CAPTURE, text)
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

  async getOverdueTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS_OVERDUE)
    return response.data
  }

  async getTodayTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS_TODAY)
    return response.data
  }

  async getTaskDependencies(id: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(getTaskDependenciesEndpoint(id))
    return response.data
  }

  async addDependency(taskId: string, dependsOnId: string): Promise<Task> {
    const response = await apiClient.post<Task>(getTaskDependenciesEndpoint(taskId), {
      dependsOn: dependsOnId
    })
    return response.data
  }

  async removeDependency(taskId: string, dependsOnId: string): Promise<Task> {
    const response = await apiClient.delete<Task>(getTaskDependencyEndpoint(taskId, dependsOnId))
    return response.data
  }
}

// Singleton instance
export const taskService = new TaskService()