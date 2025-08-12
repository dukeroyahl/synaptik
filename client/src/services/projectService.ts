import { apiClient } from './apiClient'
import { Project, UpdateProject } from '../types'
import { 
  API_ENDPOINTS, 
  getProjectEndpoint,
  getProjectActionEndpoint,
  getProjectsByStatusEndpoint,
  getProjectsByOwnerEndpoint,
  getProjectsByTagEndpoint
} from '../constants/api'

// For creating projects - uses Project interface directly
export type CreateProjectRequest = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'overdue' | 'daysUntilDue'>

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS)
    return response.data
  }

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(getProjectEndpoint(id))
    return response.data
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>(API_ENDPOINTS.PROJECTS, project)
    return response.data
  }

  async updateProject(id: string, updates: UpdateProject): Promise<Project> {
    const response = await apiClient.put<Project>(getProjectEndpoint(id), updates)
    return response.data
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(getProjectEndpoint(id))
  }

  async deleteAllProjects(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PROJECTS)
  }

  // New action methods from the updated API
  async startProject(id: string): Promise<Project> {
    const response = await apiClient.put<Project>(getProjectActionEndpoint(id, 'start'))
    return response.data
  }

  async completeProject(id: string): Promise<Project> {
    const response = await apiClient.put<Project>(getProjectActionEndpoint(id, 'complete'))
    return response.data
  }

  async updateProjectProgress(id: string, progress: number): Promise<Project> {
    const params = new URLSearchParams()
    params.set('progress', progress.toString())
    const url = `${getProjectActionEndpoint(id, 'progress')}?${params.toString()}`
    const response = await apiClient.put<Project>(url)
    return response.data
  }

  // Filtered queries
  async getActiveProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS_ACTIVE)
    return response.data
  }

  async getOverdueProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(API_ENDPOINTS.PROJECTS_OVERDUE)
    return response.data
  }

  async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(getProjectsByStatusEndpoint(status))
    return response.data
  }

  async getProjectsByOwner(owner: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(getProjectsByOwnerEndpoint(owner))
    return response.data
  }

  async getProjectsByTag(tag: string): Promise<Project[]> {
    const response = await apiClient.get<Project[]>(getProjectsByTagEndpoint(tag))
    return response.data
  }
}

export const projectService = new ProjectService()
