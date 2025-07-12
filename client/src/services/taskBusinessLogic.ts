import { Task } from '../types'
import { DateUtils } from '../utils/dateUtils'

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none'
export type EisenhowerQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important'

export interface TaskDisplayProperties {
  isOverdue: boolean
  isDueToday: boolean
  isDueTomorrow: boolean
  daysUntilDue: number | null
  timeRemaining: string
  urgencyLevel: UrgencyLevel
  urgencyColor: string
  quadrant: EisenhowerQuadrant
  canStart: boolean
  canStop: boolean
  canComplete: boolean
  canDelete: boolean
  statusColor: string
  priorityColor: string
}

export interface TaskAction {
  id: string
  label: string
  icon: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  action: () => void
}

export class TaskBusinessLogic {
  /**
   * Calculate all display properties for a task
   */
  static calculateDisplayProperties(task: Task): TaskDisplayProperties {
    const isOverdue = DateUtils.isOverdue(task.dueDate)
    const isDueToday = DateUtils.isDueToday(task.dueDate)
    const isDueTomorrow = DateUtils.isDueTomorrow(task.dueDate)
    const daysUntilDue = DateUtils.getDaysUntilDue(task.dueDate)
    const timeRemaining = task.dueDate ? DateUtils.getRelativeTime(task.dueDate) : ''
    
    return {
      isOverdue,
      isDueToday,
      isDueTomorrow,
      daysUntilDue,
      timeRemaining,
      urgencyLevel: this.getUrgencyLevel(task.urgency),
      urgencyColor: this.getUrgencyColor(task.urgency),
      quadrant: this.getEisenhowerQuadrant(task),
      canStart: this.canPerformAction(task, 'start'),
      canStop: this.canPerformAction(task, 'stop'),
      canComplete: this.canPerformAction(task, 'complete'),
      canDelete: this.canPerformAction(task, 'delete'),
      statusColor: this.getStatusColor(task.status),
      priorityColor: this.getPriorityColor(task.priority),
    }
  }

  /**
   * Get urgency level based on urgency score
   */
  static getUrgencyLevel(urgency?: number): UrgencyLevel {
    if (!urgency) return 'none'
    
    if (urgency >= 15) return 'critical'
    if (urgency >= 10) return 'high'
    if (urgency >= 6) return 'medium'
    if (urgency >= 3) return 'low'
    return 'none'
  }

  /**
   * Get color for urgency level
   */
  static getUrgencyColor(urgency?: number): string {
    const level = this.getUrgencyLevel(urgency)
    
    switch (level) {
      case 'critical': return '#d32f2f'
      case 'high': return '#f57c00'
      case 'medium': return '#fbc02d'
      case 'low': return '#388e3c'
      default: return '#666666'
    }
  }

  /**
   * Determine Eisenhower Matrix quadrant
   */
  static getEisenhowerQuadrant(task: Task): EisenhowerQuadrant {
    const isUrgent = this.isTaskUrgent(task)
    const isImportant = this.isTaskImportant(task)
    
    if (isUrgent && isImportant) return 'urgent-important'
    if (!isUrgent && isImportant) return 'not-urgent-important'
    if (isUrgent && !isImportant) return 'urgent-not-important'
    return 'not-urgent-not-important'
  }

  /**
   * Determine if task is urgent
   */
  static isTaskUrgent(task: Task): boolean {
    if (DateUtils.isOverdue(task.dueDate)) return true
    if (DateUtils.isDueToday(task.dueDate)) return true
    
    const daysUntilDue = DateUtils.getDaysUntilDue(task.dueDate)
    return daysUntilDue !== null && daysUntilDue <= 2
  }

  /**
   * Determine if task is important
   */
  static isTaskImportant(task: Task): boolean {
    // High priority tasks are always important
    if (task.priority === 'H') return true
    
    // Tasks with many dependencies might be important
    if (task.depends && task.depends.length > 0) return true
    
    // Project tasks might be important
    if (task.project) return true
    
    // Medium priority can be important in some contexts
    return task.priority === 'M'
  }

  /**
   * Check if a specific action can be performed on a task
   */
  static canPerformAction(task: Task, action: 'start' | 'stop' | 'complete' | 'delete'): boolean {
    switch (action) {
      case 'start':
        return ['pending', 'waiting'].includes(task.status)
      
      case 'stop':
        return task.status === 'active'
      
      case 'complete':
        return ['pending', 'active', 'waiting'].includes(task.status)
      
      case 'delete':
        return task.status !== 'deleted'
      
      default:
        return false
    }
  }

  /**
   * Get available actions for a task
   */
  static getAvailableActions(
    task: Task, 
    onAction: (taskId: string, action: string) => void
  ): TaskAction[] {
    const actions: TaskAction[] = []

    if (this.canPerformAction(task, 'start')) {
      actions.push({
        id: 'start',
        label: 'Start',
        icon: 'play_arrow',
        variant: 'primary',
        action: () => onAction(task.id, 'start')
      })
    }

    if (this.canPerformAction(task, 'stop')) {
      actions.push({
        id: 'stop',
        label: 'Stop',
        icon: 'pause',
        variant: 'secondary',
        action: () => onAction(task.id, 'stop')
      })
    }

    if (this.canPerformAction(task, 'complete')) {
      actions.push({
        id: 'complete',
        label: 'Complete',
        icon: 'check_circle',
        variant: 'success',
        action: () => onAction(task.id, 'done')
      })
    }

    if (this.canPerformAction(task, 'delete')) {
      actions.push({
        id: 'delete',
        label: 'Archive',
        icon: 'archive',
        variant: 'warning',
        action: () => onAction(task.id, 'delete')
      })
    }

    return actions
  }

  /**
   * Validate task status transition
   */
  static validateStatusTransition(from: Task['status'], to: Task['status']): boolean {
    const validTransitions: Record<Task['status'], Task['status'][]> = {
      pending: ['active', 'waiting', 'completed', 'deleted'],
      waiting: ['pending', 'active', 'completed', 'deleted'],
      active: ['pending', 'completed', 'deleted'],
      completed: ['pending', 'deleted'],
      deleted: ['pending']
    }

    return validTransitions[from]?.includes(to) ?? false
  }

  /**
   * Get color for task status
   */
  static getStatusColor(status: Task['status']): string {
    switch (status) {
      case 'pending': return '#1976d2'
      case 'active': return '#388e3c'
      case 'waiting': return '#f57c00'
      case 'completed': return '#666666'
      case 'deleted': return '#d32f2f'
      default: return '#666666'
    }
  }

  /**
   * Get color for task priority
   */
  static getPriorityColor(priority: Task['priority']): string {
    switch (priority) {
      case 'H': return '#d32f2f'
      case 'M': return '#f57c00'
      case 'L': return '#388e3c'
      default: return '#666666'
    }
  }

  /**
   * Calculate task completion percentage for project
   */
  static calculateProjectProgress(tasks: Task[]): number {
    if (tasks.length === 0) return 0
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  /**
   * Group tasks by their status
   */
  static groupTasksByStatus(tasks: Task[]): Record<Task['status'], Task[]> {
    return tasks.reduce((groups, task) => {
      const status = task.status
      if (!groups[status]) {
        groups[status] = []
      }
      groups[status].push(task)
      return groups
    }, {} as Record<Task['status'], Task[]>)
  }

  /**
   * Sort tasks by urgency and due date
   */
  static sortTasksByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // First sort by urgency (higher urgency first)
      const urgencyDiff = (b.urgency || 0) - (a.urgency || 0)
      if (urgencyDiff !== 0) return urgencyDiff
      
      // Then by due date (earlier due date first)
      const aDate = DateUtils.parseTaskDate(a.dueDate)
      const bDate = DateUtils.parseTaskDate(b.dueDate)
      
      if (aDate && bDate) {
        return aDate.getTime() - bDate.getTime()
      }
      if (aDate) return -1
      if (bDate) return 1
      
      // Finally by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  /**
   * Filter tasks for today's work
   */
  static getTodaysWorkTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      // Include overdue tasks
      if (DateUtils.isOverdue(task.dueDate)) return true
      
      // Include tasks due today
      if (DateUtils.isDueToday(task.dueDate)) return true
      
      // Include active tasks
      if (task.status === 'active') return true
      
      // Include high priority tasks without due dates
      if (task.priority === 'H' && !task.dueDate) return true
      
      return false
    })
  }
}