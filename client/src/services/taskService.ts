import { apiClient } from './apiClient'
import { Task, TaskDTO, TaskRequest, TaskSearchParams, TaskGraphResponse } from '../types'
import { 
  API_ENDPOINTS, 
  getTaskEndpoint, 
  getTaskStatusEndpoint,
  getTaskNeighborsEndpoint
} from '../constants/api'

export class TaskService {
  private basePath = API_ENDPOINTS.TASKS

  // Core CRUD operations
  async getTasks(filters?: TaskSearchParams): Promise<TaskDTO[]> {
    if (!filters || Object.keys(filters).length === 0) {
      // If no filters, get all tasks
      const response = await apiClient.get<TaskDTO[]>(this.basePath)
      return response.data
    }
    
    // Use search API with filters
    const params = new URLSearchParams()
    if (filters.assignee) params.set('assignee', filters.assignee)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.projectId) params.set('projectId', filters.projectId)
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(status => params.append('status', status))
      } else {
        params.set('status', filters.status)
      }
    }
    if (filters.title) params.set('title', filters.title)
    if (filters.tz) params.set('tz', filters.tz)

    const url = `${API_ENDPOINTS.TASKS_SEARCH}?${params.toString()}`
    const response = await apiClient.get<TaskDTO[]>(url)
    return response.data
  }

  async getTaskById(id: string): Promise<TaskDTO> {
    const response = await apiClient.get<TaskDTO>(getTaskEndpoint(id))
    return response.data
  }

  async createTask(data: TaskRequest): Promise<TaskDTO> {
    const response = await apiClient.post<TaskDTO>(this.basePath, data)
    return response.data
  }

  async updateTask(id: string, data: TaskRequest): Promise<TaskDTO> {
    const response = await apiClient.put<TaskDTO>(getTaskEndpoint(id), data)
    return response.data
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(getTaskEndpoint(id))
  }

  async updateTaskStatus(id: string, status: TaskDTO['status']): Promise<TaskDTO> {
    const response = await apiClient.put<TaskDTO>(getTaskStatusEndpoint(id), status)
    return response.data
  }

  // Convenience methods for common status updates
  async startTask(id: string): Promise<TaskDTO> {
    return this.updateTaskStatus(id, 'ACTIVE')
  }

  async stopTask(id: string): Promise<TaskDTO> {
    return this.updateTaskStatus(id, 'PENDING')
  }

  async completeTask(id: string): Promise<TaskDTO> {
    return this.updateTaskStatus(id, 'COMPLETED')
  }

  async archiveTask(id: string): Promise<TaskDTO> {
    return this.updateTaskStatus(id, 'DELETED')
  }

  // Quick task creation from text input
  async captureTask(text: string, projectName?: string, projectId?: string): Promise<TaskDTO> {
    const taskData: TaskRequest = {
      title: text.trim(),
      priority: 'MEDIUM',
      projectName,
      projectId
    }
    
    return this.createTask(taskData)
  }

  // Filtered queries for common use cases (using search API)
  async getPendingTasks(): Promise<TaskDTO[]> {
    return this.getTasks({ status: ['PENDING'] })
  }

  async getActiveTasks(): Promise<TaskDTO[]> {
    return this.getTasks({ status: ['ACTIVE'] })
  }

  async getCompletedTasks(): Promise<TaskDTO[]> {
    return this.getTasks({ status: ['COMPLETED'] })
  }

  async getOverdueTasks(tz?: string): Promise<TaskDTO[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getTasks({ 
      dateTo: today,
      status: ['PENDING', 'ACTIVE'],
      tz: tz || 'UTC'
    })
  }

  async getTodayTasks(tz?: string): Promise<TaskDTO[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getTasks({ 
      dateFrom: today,
      dateTo: today,
      tz: tz || 'UTC'
    })
  }

  // New dependency-related methods
  async getTaskDependencyGraph(statuses?: string[]): Promise<TaskGraphResponse> {
    let url = API_ENDPOINTS.TASKS_GRAPH
    if (statuses && statuses.length > 0) {
      const params = new URLSearchParams()
      params.set('statuses', statuses.join(','))
      url += `?${params.toString()}`
    }
    
    const response = await apiClient.get<TaskGraphResponse>(url)
    return response.data
  }

  async getTaskNeighbors(id: string, depth: number = 1, includePlaceholders: boolean = true): Promise<any> {
    const params = new URLSearchParams()
    params.set('depth', depth.toString())
    params.set('includePlaceholders', includePlaceholders.toString())
    
    const url = `${getTaskNeighborsEndpoint(id)}?${params.toString()}`
    const response = await apiClient.get<any>(url)
    return response.data
  }

  // Backward compatibility methods (convert TaskDTO to Task for legacy components)
  private convertTaskDTOToTask(dto: TaskDTO): Task {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description || null,
      status: dto.status,
      priority: dto.priority,
      project: dto.projectName || null,
      assignee: dto.assignee || null,
      dueDate: dto.dueDate || null,
      waitUntil: dto.waitUntil || null,
      tags: dto.tags,
      annotations: [], // Not supported in new API
      depends: dto.depends,
      originalInput: null, // Not supported in new API
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    }
  }

  // Legacy methods for backward compatibility
  async getTasksLegacy(filters?: TaskSearchParams): Promise<Task[]> {
    const dtos = await this.getTasks(filters)
    return dtos.map(dto => this.convertTaskDTOToTask(dto))
  }
}

// Singleton instance
export const taskService = new TaskService()