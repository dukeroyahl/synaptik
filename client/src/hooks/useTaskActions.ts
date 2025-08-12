import { useCallback } from 'react'
import { useUpdateTask, useTaskAction } from './useTasks'
import { useApiErrorHandler } from './useErrorHandler'
import { TaskDTO } from '../types'
import { taskService } from '../services/taskService'

export interface UseTaskActionsReturn {
  markDone: (task: TaskDTO) => Promise<void>
  unmarkDone: (task: TaskDTO) => Promise<void>
  startTask: (task: TaskDTO) => Promise<void>
  stopTask: (task: TaskDTO) => Promise<void>
  deleteTask: (task: TaskDTO) => Promise<void>
  updateTask: (task: TaskDTO, updates: Partial<TaskDTO>) => Promise<void>
  isLoading: boolean
}

export const useTaskActions = (onSuccess?: () => void): UseTaskActionsReturn => {
  const updateTaskMutation = useUpdateTask()
  const taskActionMutation = useTaskAction()
  const { handleApiError } = useApiErrorHandler()

  // Helper to build clean update payload without verbose repetition
  const buildUpdatePayload = useCallback((task: TaskDTO, updates: Partial<TaskDTO>) => {
    return {
      title: updates.title ?? task.title,
      description: updates.description ?? task.description ?? undefined,
      status: updates.status ?? task.status,
      priority: updates.priority ?? task.priority,
      projectName: updates.projectName ?? task.projectName ?? undefined,
      assignee: updates.assignee ?? task.assignee ?? undefined,
      dueDate: updates.dueDate ?? task.dueDate ?? undefined,
      waitUntil: updates.waitUntil ?? task.waitUntil ?? undefined,
      tags: updates.tags ?? task.tags ?? [],
      depends: updates.depends ?? task.depends ?? []
    }
  }, [])

  // Generic update handler with error handling
  const handleUpdate = useCallback(async (task: TaskDTO, updates: Partial<TaskDTO>, actionName: string) => {
    try {
      const payload = buildUpdatePayload(task, updates)
      await updateTaskMutation.mutateAsync({ id: task.id, data: payload })
      onSuccess?.()
    } catch (error) {
      handleApiError(error, `Failed to ${actionName} task "${task.title}"`)
      throw error
    }
  }, [updateTaskMutation, buildUpdatePayload, handleApiError, onSuccess])

  // Mark task as done
  const markDone = useCallback(async (task: TaskDTO) => {
    await handleUpdate(task, { status: 'COMPLETED' }, 'complete')
  }, [handleUpdate])

  // Mark task as not done
  const unmarkDone = useCallback(async (task: TaskDTO) => {
    await handleUpdate(task, { status: 'PENDING' }, 'uncomplete')
  }, [handleUpdate])

  // Start task (set to ACTIVE)
  const startTask = useCallback(async (task: TaskDTO) => {
    await handleUpdate(task, { status: 'ACTIVE' }, 'start')
  }, [handleUpdate])

  // Stop task (set back to PENDING)
  const stopTask = useCallback(async (task: TaskDTO) => {
    await handleUpdate(task, { status: 'PENDING' }, 'stop')
  }, [handleUpdate])

  // Delete task
  const deleteTask = useCallback(async (task: TaskDTO) => {
    try {
      const success = await taskService.deleteTask(task.id)
      if (!success) {
        throw new Error('Task deletion was not confirmed by server')
      }
      onSuccess?.()
    } catch (error) {
      handleApiError(error, `Failed to delete task "${task.title}"`)
      throw error
    }
  }, [handleApiError, onSuccess])

  // General update task with custom updates
  const updateTask = useCallback(async (task: TaskDTO, updates: Partial<TaskDTO>) => {
    await handleUpdate(task, updates, 'update')
  }, [handleUpdate])

  return {
    markDone,
    unmarkDone,
    startTask,
    stopTask,
    deleteTask,
    updateTask,
    isLoading: updateTaskMutation.isPending || taskActionMutation.isPending
  }
}

// Convenience hook with confirm dialog for destructive actions
export const useTaskActionsWithConfirm = (onSuccess?: () => void) => {
  const baseActions = useTaskActions(onSuccess)

  const deleteTaskWithConfirm = useCallback(async (task: TaskDTO) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await baseActions.deleteTask(task)
    }
  }, [baseActions])

  return {
    ...baseActions,
    deleteTask: deleteTaskWithConfirm
  }
}