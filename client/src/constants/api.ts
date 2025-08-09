// API endpoint constants
export const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  TASKS_PENDING: '/api/tasks/pending',
  TASKS_ACTIVE: '/api/tasks/active',
  TASKS_OVERDUE: '/api/tasks/overdue',
  TASKS_TODAY: '/api/tasks/today',
  TASKS_COMPLETED: '/api/tasks/completed',
} as const

// Helper functions for dynamic endpoints
export const getTaskEndpoint = (id: string) => `${API_ENDPOINTS.TASKS}/${id}`
export const getTaskActionEndpoint = (id: string, action: string) => `${API_ENDPOINTS.TASKS}/${id}/${action}`
export const getTaskDependenciesEndpoint = (id: string) => `${API_ENDPOINTS.TASKS}/${id}/dependencies`
export const getTaskDependencyEndpoint = (taskId: string, dependsOnId: string) => `${API_ENDPOINTS.TASKS}/${taskId}/dependencies/${dependsOnId}`