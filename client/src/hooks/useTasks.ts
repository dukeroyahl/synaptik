import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService, TaskQueryParams, CreateTaskRequest, UpdateTaskRequest, TaskAction } from '../services/taskService'

// Query keys for consistent caching
export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'list'] as const,
  list: (filters?: TaskQueryParams) => [...taskQueryKeys.lists(), filters] as const,
  details: () => [...taskQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskQueryKeys.details(), id] as const,
}

// Hook for fetching tasks with filters
export const useTasks = (filters?: TaskQueryParams) => {
  return useQuery({
    queryKey: taskQueryKeys.list(filters),
    queryFn: () => taskService.getTasks(filters),
    staleTime: 30000,
  })
}

// Hook for fetching a single task
export const useTask = (id: string) => {
  return useQuery({
    queryKey: taskQueryKeys.detail(id),
    queryFn: () => taskService.getTaskById(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

// Hook for creating tasks
export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() })
    },
  })
}

// Hook for updating tasks
export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      taskService.updateTask(id, data),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskQueryKeys.detail(updatedTask.id), updatedTask)
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() })
    },
  })
}

// Hook for task actions (start, stop, complete, delete)
export const useTaskAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: TaskAction }) =>
      taskService.performAction(id, action),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskQueryKeys.detail(updatedTask.id), updatedTask)
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() })
    },
  })
}