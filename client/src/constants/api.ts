// API endpoint constants
export const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  TASKS_SEARCH: '/api/tasks/search',
  TASKS_GRAPH: '/api/tasks/graph',
  PROJECTS: '/api/projects',
  PROJECTS_ACTIVE: '/api/projects/active',
  PROJECTS_OVERDUE: '/api/projects/overdue',
  PROJECTS_STATUS: '/api/projects/status',
  PROJECTS_OWNER: '/api/projects/owner',
  PROJECTS_TAG: '/api/projects/tag',
} as const

// Helper functions for dynamic endpoints
export const getTaskEndpoint = (id: string) => `${API_ENDPOINTS.TASKS}/${id}`
export const getTaskStatusEndpoint = (id: string) => `${API_ENDPOINTS.TASKS}/${id}/status`
export const getTaskNeighborsEndpoint = (id: string) => `${API_ENDPOINTS.TASKS}/${id}/neighbors`
export const getProjectEndpoint = (id: string) => `${API_ENDPOINTS.PROJECTS}/${id}`
export const getProjectActionEndpoint = (id: string, action: string) => `${API_ENDPOINTS.PROJECTS}/${id}/${action}`
export const getProjectsByStatusEndpoint = (status: string) => `${API_ENDPOINTS.PROJECTS_STATUS}/${status}`
export const getProjectsByOwnerEndpoint = (owner: string) => `${API_ENDPOINTS.PROJECTS_OWNER}/${owner}`
export const getProjectsByTagEndpoint = (tag: string) => `${API_ENDPOINTS.PROJECTS_TAG}/${tag}`