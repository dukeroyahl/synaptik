import { useCallback } from 'react'
import { useUpdateTask, useTaskAction } from './useTasks'
import { useApiErrorHandler } from './useErrorHandler'
import { Task } from '../types'
import { taskService } from '../services/taskService'

export interface UseTaskActionsReturn {
  markDone: (task: Task) => Promise<void>
  unmarkDone: (task: Task) => Promise<void>
  startTask: (task: Task) => Promise<void>
  stopTask: (task: Task) => Promise<void>
  deleteTask: (task: Task) => Promise<void>
  updateTask: (task: Task, updates: Partial<Task>) => Promise<void>
  isLoading: boolean
}

export const useTaskActions = (onSuccess?: () => void): UseTaskActionsReturn => {
  const updateTaskMutation = useUpdateTask()
  const taskActionMutation = useTaskAction()
  const { handleApiError } = useApiErrorHandler()

  // Helper to build clean update payload without verbose repetition
  const buildUpdatePayload = useCallback((task: Task, updates: Partial<Task>) => {
    return {
      title: updates.title ?? task.title,
      description: updates.description ?? task.description ?? undefined,
      status: updates.status ?? task.status,
      priority: updates.priority ?? task.priority,
      project: updates.project ?? task.project ?? undefined,
      assignee: updates.assignee ?? task.assignee ?? undefined,
      dueDate: updates.dueDate ?? task.dueDate ?? undefined,
      waitUntil: updates.waitUntil ?? task.waitUntil ?? undefined,
      tags: updates.tags ?? task.tags ?? [],
      depends: updates.depends ?? task.depends ?? []
    }
  }, [])

  // Generic update handler with error handling
  const handleUpdate = useCallback(async (task: Task, updates: Partial<Task>, actionName: string) => {
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
  const markDone = useCallback(async (task: Task) => {
    await handleUpdate(task, { status: 'COMPLETED' }, 'complete')
  }, [handleUpdate])

  // Mark task as not done
  const unmarkDone = useCallback(async (task: Task) => {
    await handleUpdate(task, { status: 'PENDING' }, 'uncomplete')
  }, [handleUpdate])

  // Start task (set to ACTIVE)
  const startTask = useCallback(async (task: Task) => {
    await handleUpdate(task, { status: 'ACTIVE' }, 'start')
  }, [handleUpdate])

  // Stop task (set back to PENDING)
  const stopTask = useCallback(async (task: Task) => {
    await handleUpdate(task, { status: 'PENDING' }, 'stop')
  }, [handleUpdate])

  // Delete task
  const deleteTask = useCallback(async (task: Task) => {
    try {
      await taskService.deleteTask(task.id)
      onSuccess?.()
    } catch (error) {
      handleApiError(error, `Failed to delete task "${task.title}"`)
      throw error
    }
  }, [handleApiError, onSuccess])

  // General update task with custom updates
  const updateTask = useCallback(async (task: Task, updates: Partial<Task>) => {
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

  const deleteTaskWithConfirm = useCallback(async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await baseActions.deleteTask(task)
    }
  }, [baseActions])

  return {
    ...baseActions,
    deleteTask: deleteTaskWithConfirm
  }
}