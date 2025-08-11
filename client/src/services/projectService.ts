import { apiClient } from './apiClient'
import { Project } from '../types'
import { API_ENDPOINTS } from '../constants/api'

export interface CreateProjectRequest {
  name: string
  description?: string
  owner?: string
  dueDate?: string
  tags?: string[]
  color?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: Project['status']
  progress?: number
}

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS)
    return response.data
  }

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`${API_ENDPOINTS.PROJECTS}/${id}`)
    return response.data
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>(API_ENDPOINTS.PROJECTS, project)
    return response.data
  }

  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`${API_ENDPOINTS.PROJECTS}/${id}`, updates)
    return response.data
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.PROJECTS}/${id}`)
  }

  async deleteAllProjects(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PROJECTS)
  }

  // Note: Project status is automatically managed by the server based on task states
  // startProject and completeProject methods are not needed

  async updateProjectProgress(id: string, progress: number): Promise<Project> {
    const response = await apiClient.put<Project>(`${API_ENDPOINTS.PROJECTS}/${id}/progress`, { progress })
    return response.data
  }

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(`${API_ENDPOINTS.PROJECTS}/status/${status}`)
    return response.data
  }
}

export const projectService = new ProjectService()
