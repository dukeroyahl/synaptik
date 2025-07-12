import { Task } from '../models'
import { ITask } from '../models/Task'

export interface TaskCaptureInput {
  title: string
  description?: string
  priority?: 'H' | 'M' | 'L' | ''
  project?: string
  assignee?: string
  tags?: string[]
  dueDate?: string
  scheduledDate?: string
  waitUntil?: string
  depends?: string[]
}

export interface TaskFilter {
  status?: string[]
  priority?: string[]
  project?: string
  tags?: string[]
  assignee?: string
  dueBefore?: Date
  dueAfter?: Date
  depends?: string
  limit?: number
  sortBy?: 'urgency' | 'due' | 'priority' | 'entry' | 'modified'
  sortOrder?: 'asc' | 'desc'
}

export class TaskWarriorService {
  
  /**
   * Quick task capture - TaskWarrior style
   * Examples:
   * - "Buy groceries due:tomorrow +shopping"
   * - "Fix bug priority:H project:webapp"
   * - "Call mom scheduled:friday"
   */
  static async captureTask(input: string | TaskCaptureInput): Promise<ITask> {
    let taskData: TaskCaptureInput
    
    if (typeof input === 'string') {
      taskData = this.parseTaskString(input)
    } else {
      taskData = input
    }
    
    const task = new Task({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || '',
      project: taskData.project,
      assignee: taskData.assignee,
      tags: taskData.tags || [],
      dueDate: taskData.dueDate ? this.parseDate(taskData.dueDate).toISOString() : undefined,
      scheduledDate: taskData.scheduledDate ? this.parseDate(taskData.scheduledDate).toISOString() : undefined,
      waitUntil: taskData.waitUntil ? this.parseDate(taskData.waitUntil).toISOString() : undefined,
      depends: taskData.depends || [],
      annotations: [],
      status: 'pending'
    })
    
    return await task.save()
  }
  
  /**
   * Parse TaskWarrior-style task string
   * Format: "Task description attribute:value +tag project:name"
   */
  static parseTaskString(input: string): TaskCaptureInput {
    const result: TaskCaptureInput = {
      title: '',
      tags: []
    }
    
    const tokens = input.split(/\s+/)
    const titleTokens: string[] = []
    
    for (const token of tokens) {
      if (token.startsWith('priority:')) {
        const priority = token.substring(9).toUpperCase()
        if (['H', 'M', 'L'].includes(priority)) {
          result.priority = priority as 'H' | 'M' | 'L'
        }
      } else if (token.startsWith('project:')) {
        result.project = token.substring(8)
      } else if (token.startsWith('assignee:')) {
        result.assignee = token.substring(9)
      } else if (token.startsWith('due:')) {
        result.dueDate = token.substring(4)
      } else if (token.startsWith('scheduled:')) {
        result.scheduledDate = token.substring(10)
      } else if (token.startsWith('wait:')) {
        result.waitUntil = token.substring(5)
      } else if (token.startsWith('depends:')) {
        result.depends = token.substring(8).split(',')
      } else if (token.startsWith('+')) {
        result.tags!.push(token.substring(1))
      } else {
        titleTokens.push(token)
      }
    }
    
    result.title = titleTokens.join(' ').trim()
    return result
  }
  
  /**
   * Parse flexible date strings (TaskWarrior style)
   */
  static parseDate(dateStr: string): Date {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateStr.toLowerCase()) {
      case 'today':
        return today
      case 'tomorrow':
        return new Date(today.getTime() + 24 * 60 * 60 * 1000)
      case 'yesterday':
        return new Date(today.getTime() - 24 * 60 * 60 * 1000)
      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        return this.getNextWeekday(dateStr.toLowerCase())
      case 'eom': // End of month
        return new Date(now.getFullYear(), now.getMonth() + 1, 0)
      case 'eoy': // End of year
        return new Date(now.getFullYear(), 11, 31)
      default:
        // Try parsing as ISO date or relative format
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(dateStr)
        }
        if (dateStr.match(/^\d+d$/)) {
          const days = parseInt(dateStr.replace('d', ''))
          return new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
        }
        if (dateStr.match(/^\d+w$/)) {
          const weeks = parseInt(dateStr.replace('w', ''))
          return new Date(today.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
        }
        return new Date(dateStr) // Fallback to Date constructor
    }
  }
  
  private static getNextWeekday(day: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = new Date()
    const todayIndex = today.getDay()
    const targetIndex = days.indexOf(day)
    
    let daysUntilTarget = targetIndex - todayIndex
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7 // Next week
    }
    
    return new Date(today.getTime() + daysUntilTarget * 24 * 60 * 60 * 1000)
  }
  
  /**
   * Get tasks with TaskWarrior-style filtering
   */
  static async getTasks(filter: TaskFilter = {}): Promise<ITask[]> {
    const query: any = {}
    
    // Status filter
    if (filter.status && filter.status.length > 0) {
      query.status = { $in: filter.status }
    } else {
      // Default: exclude deleted tasks
      query.status = { $ne: 'deleted' }
    }
    
    // Priority filter
    if (filter.priority && filter.priority.length > 0) {
      query.priority = { $in: filter.priority }
    }
    
    // Project filter
    if (filter.project) {
      query.project = filter.project
    }
    
    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags }
    }
    
    // Assignee filter
    if (filter.assignee) {
      query.assignee = filter.assignee
    }
    
    // Due date filters
    if (filter.dueBefore || filter.dueAfter) {
      query.dueDate = {}
      if (filter.dueBefore) query.dueDate.$lte = filter.dueBefore
      if (filter.dueAfter) query.dueDate.$gte = filter.dueAfter
    }
    
    // Depends filter (tasks that depend on a specific task)
    if (filter.depends) {
      query.depends = filter.depends;
    }
    
    // Build sort criteria
    const sortBy = filter.sortBy || 'urgency'
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1
    const sort: any = {}
    
    if (sortBy === 'urgency') {
      sort.urgency = -1 // High urgency first
      sort.priority = -1 // Then by priority
    } else {
      sort[sortBy] = sortOrder
    }
    
    const tasks = await Task.find(query)
      .sort(sort)
      .limit(filter.limit || 100)
      .exec()
    
    return tasks
  }
  
  /**
   * Get pending tasks (TaskWarrior default view)
   */
  static async getPendingTasks(): Promise<ITask[]> {
    return this.getTasks({
      status: ['pending', 'active'],
      sortBy: 'urgency',
      sortOrder: 'desc'
    })
  }
  
  /**
   * Get next task (highest urgency pending task)
   */
  static async getNextTask(): Promise<ITask | null> {
    const tasks = await this.getTasks({
      status: ['pending'],
      sortBy: 'urgency',
      sortOrder: 'desc',
      limit: 1
    })
    
    return tasks.length > 0 ? tasks[0]! : null
  }
  
  /**
   * Get active tasks
   */
  static async getActiveTasks(): Promise<ITask[]> {
    return this.getTasks({
      status: ['active'],
      sortBy: 'urgency',
      sortOrder: 'desc'
    })
  }
  
  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(): Promise<ITask[]> {
    return this.getTasks({
      status: ['pending', 'active'],
      dueBefore: new Date(),
      sortBy: 'due',
      sortOrder: 'asc'
    })
  }
  
  /**
   * Get tasks for today
   */
  static async getTodayTasks(): Promise<ITask[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
    
    return this.getTasks({
      status: ['pending', 'active'],
      dueAfter: startOfDay,
      dueBefore: endOfDay,
      sortBy: 'urgency',
      sortOrder: 'desc'
    })
  }
}
