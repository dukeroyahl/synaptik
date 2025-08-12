import { apiClient } from './apiClient'
import { Task, TaskDTO, TaskRequest, TaskSearchParams, TaskGraphResponse } from '../types'
import { 
  API_ENDPOINTS, 
  getTaskEndpoint, 
  getTaskStatusEndpoint,
  getTaskNeighborsEndpoint
} from '../constants/api'
import { getUserTimezone, getCurrentDateOnly } from '../utils/dateUtils'

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
    console.log('TaskService.createTask - endpoint:', this.basePath);
    console.log('TaskService.createTask - data:', data);
    console.log('TaskService.createTask - data JSON:', JSON.stringify(data));
    
    try {
      const response = await apiClient.post<TaskDTO>(this.basePath, data)
      console.log('TaskService.createTask - response:', response);
      return response.data
    } catch (error) {
      console.error('TaskService.createTask - error:', error);
      throw error;
    }
  }

  async updateTask(id: string, data: TaskRequest): Promise<TaskDTO> {
    const response = await apiClient.put<TaskDTO>(getTaskEndpoint(id), data)
    return response.data
  }

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(getTaskEndpoint(id))
  }

  async updateTaskStatus(id: string, status: TaskDTO['status']): Promise<TaskDTO> {
    console.log('TaskService.updateTaskStatus called with:', { id, status });
    const endpoint = getTaskStatusEndpoint(id);
    console.log('Using endpoint:', endpoint);
    try {
      const response = await apiClient.put<boolean>(endpoint, status);
      console.log('TaskService.updateTaskStatus response:', response);
      
      // The API now returns a boolean, so we need to fetch the updated task
      if (response.data === true) {
        console.log('Status update successful, fetching updated task');
        const updatedTask = await this.getTaskById(id);
        console.log('Fetched updated task:', updatedTask);
        return updatedTask;
      } else {
        throw new Error('Task status update failed');
      }
    } catch (error) {
      console.error('TaskService.updateTaskStatus error:', error);
      throw error;
    }
  }

  // Convenience methods for common status updates
  async startTask(id: string): Promise<TaskDTO> {
    console.log('TaskService.startTask called with id:', id);
    try {
      const result = await this.updateTaskStatus(id, 'ACTIVE');
      console.log('TaskService.startTask success:', result);
      return result;
    } catch (error) {
      console.error('TaskService.startTask error:', error);
      throw error;
    }
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
      description: '', // Provide empty string instead of undefined
      priority: 'MEDIUM',
      status: 'PENDING', // Explicitly set status
      projectName,
      projectId,
      tags: [], // Provide empty array instead of undefined
      depends: [], // Provide empty array for dependencies
    }
    
    console.log('TaskService.captureTask - sending data:', taskData);
    console.log('TaskService.captureTask - JSON stringified:', JSON.stringify(taskData));
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
    const timezone = tz || getUserTimezone()
    const today = getCurrentDateOnly(timezone)
    return this.getTasks({ 
      dateTo: today,
      status: ['PENDING', 'ACTIVE'],
      tz: timezone
    })
  }

  async getTodayTasks(tz?: string): Promise<TaskDTO[]> {
    const timezone = tz || getUserTimezone()
    const today = getCurrentDateOnly(timezone)
    return this.getTasks({ 
      dateFrom: today,
      dateTo: today,
      tz: timezone
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

  // Import/Export methods
  async importTasks(file: File): Promise<{ success: boolean; message: string; count?: number }> {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await apiClient.post<{ success: boolean; message: string; count?: number }>(
        API_ENDPOINTS.TASKS_IMPORT, 
        formData
      )
      return response.data
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async exportTasks(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const response = await fetch(`${apiClient.baseURL}${API_ENDPOINTS.TASKS_EXPORT}?format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'json' ? 'application/json' : 'text/csv',
        }
      })
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      return await response.blob()
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Singleton instance
export const taskService = new TaskService()