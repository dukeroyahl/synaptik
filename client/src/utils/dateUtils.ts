import { format, isValid, parseISO, differenceInDays, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns'

export class DateUtils {
  /**
   * Parse a date string into a Date object
   * Handles both ISO strings and YYYY-MM-DD format
   */
  static parseTaskDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null
    
    try {
      // Try parsing as ISO string first
      const isoDate = parseISO(dateStr)
      if (isValid(isoDate)) {
        return isoDate
      }
      
      // Try parsing as YYYY-MM-DD
      const dashDate = new Date(dateStr + 'T00:00:00')
      if (isValid(dashDate)) {
        return dashDate
      }
      
      return null
    } catch {
      return null
    }
  }

  /**
   * Format a date for display in the UI
   */
  static formatForDisplay(date: Date | string | undefined, includeTime = false): string {
    const parsedDate = typeof date === 'string' ? this.parseTaskDate(date) : date
    if (!parsedDate || !isValid(parsedDate)) return 'No date'
    
    if (isToday(parsedDate)) {
      return includeTime ? `Today ${format(parsedDate, 'HH:mm')}` : 'Today'
    }
    
    if (isTomorrow(parsedDate)) {
      return includeTime ? `Tomorrow ${format(parsedDate, 'HH:mm')}` : 'Tomorrow'
    }
    
    const formatStr = includeTime ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy'
    return format(parsedDate, formatStr)
  }

  /**
   * Get relative time string (e.g., "2 days ago", "in 3 hours")
   */
  static getRelativeTime(date: Date | string | undefined): string {
    const parsedDate = typeof date === 'string' ? this.parseTaskDate(date) : date
    if (!parsedDate || !isValid(parsedDate)) return ''
    
    return formatDistanceToNow(parsedDate, { addSuffix: true })
  }

  /**
   * Check if a task date is overdue
   */
  static isOverdue(dueDate: string | undefined): boolean {
    const date = this.parseTaskDate(dueDate)
    return date ? isPast(date) && !isToday(date) : false
  }

  /**
   * Check if a task is due today
   */
  static isDueToday(dueDate: string | undefined): boolean {
    const date = this.parseTaskDate(dueDate)
    return date ? isToday(date) : false
  }

  /**
   * Check if a task is due tomorrow
   */
  static isDueTomorrow(dueDate: string | undefined): boolean {
    const date = this.parseTaskDate(dueDate)
    return date ? isTomorrow(date) : false
  }

  /**
   * Get days until due (negative if overdue)
   */
  static getDaysUntilDue(dueDate: string | undefined): number | null {
    const date = this.parseTaskDate(dueDate)
    return date ? differenceInDays(date, new Date()) : null
  }

  /**
   * Validate if a date string is valid for tasks
   */
  static isValidTaskDate(dateStr: string): boolean {
    return this.parseTaskDate(dateStr) !== null
  }

  /**
   * Format date for API submission (ISO string)
   */
  static formatForAPI(date: Date | string): string {
    const parsedDate = typeof date === 'string' ? this.parseTaskDate(date) : date
    if (!parsedDate || !isValid(parsedDate)) {
      throw new Error('Invalid date provided for API formatting')
    }
    return parsedDate.toISOString()
  }

  /**
   * Get urgency contribution based on due date
   * Used for urgency calculations
   */
  static getUrgencyFromDueDate(dueDate: string | undefined): number {
    const date = this.parseTaskDate(dueDate)
    if (!date) return 0
    
    const daysUntilDue = differenceInDays(date, new Date())
    
    if (daysUntilDue < 0) return 12 // Overdue
    if (daysUntilDue === 0) return 10 // Due today
    if (daysUntilDue === 1) return 8 // Due tomorrow
    if (daysUntilDue <= 7) return 6 // Due this week
    if (daysUntilDue <= 30) return 3 // Due this month
    
    return 1 // Due later
  }

  /**
   * Create date filter for API queries
   */
  static createDateFilter(startDate?: Date, endDate?: Date) {
    const filter: { dueAfter?: string; dueBefore?: string } = {}
    
    if (startDate) {
      filter.dueAfter = this.formatForAPI(startDate)
    }
    
    if (endDate) {
      filter.dueBefore = this.formatForAPI(endDate)
    }
    
    return filter
  }
}