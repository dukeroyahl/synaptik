import { useState, useCallback } from 'react'

export interface AppError {
  id: string
  message: string
  code?: string
  details?: any
  timestamp: Date
  type: 'network' | 'validation' | 'authentication' | 'permission' | 'server' | 'client'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage?: string
  actions?: Array<{
    label: string
    action: () => void
  }>
}

interface UseErrorHandlerReturn {
  errors: AppError[]
  addError: (error: Partial<AppError>) => void
  removeError: (id: string) => void
  clearErrors: () => void
  hasErrors: boolean
  getErrorsByType: (type: AppError['type']) => AppError[]
  getErrorsBySeverity: (severity: AppError['severity']) => AppError[]
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errors, setErrors] = useState<AppError[]>([])

  const addError = useCallback((errorData: Partial<AppError>) => {
    const error: AppError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: errorData.message || 'An unknown error occurred',
      timestamp: new Date(),
      type: errorData.type || 'client',
      severity: errorData.severity || 'medium',
      userMessage: errorData.userMessage || getUserFriendlyMessage(errorData),
      ...errorData
    }

    setErrors(prev => [...prev, error])

    // Auto-remove low severity errors after 5 seconds
    if (error.severity === 'low') {
      setTimeout(() => {
        removeError(error.id)
      }, 5000)
    }

    // Log error for debugging in development only
    if (import.meta.env.DEV) {
      console.error('Error added:', error)
    }
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const getErrorsByType = useCallback((type: AppError['type']) => {
    return errors.filter(error => error.type === type)
  }, [errors])

  const getErrorsBySeverity = useCallback((severity: AppError['severity']) => {
    return errors.filter(error => error.severity === severity)
  }, [errors])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors: errors.length > 0,
    getErrorsByType,
    getErrorsBySeverity
  }
}

// Helper function to generate user-friendly messages
function getUserFriendlyMessage(errorData: Partial<AppError>): string {
  if (errorData.userMessage) {
    return errorData.userMessage
  }

  switch (errorData.type) {
    case 'network':
      return 'Network connection error. Please check your internet connection and try again.'
    case 'validation':
      return 'Please check your input and try again.'
    case 'authentication':
      return 'Authentication failed. Please log in again.'
    case 'permission':
      return 'You don\'t have permission to perform this action.'
    case 'server':
      return 'Server error. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

// Helper hook for API error handling
export const useApiErrorHandler = () => {
  const { addError } = useErrorHandler()

  const handleApiError = useCallback((error: any, context?: string) => {
    let errorType: AppError['type'] = 'server'
    let severity: AppError['severity'] = 'medium'
    let message = 'An API error occurred'
    let userMessage = 'Something went wrong. Please try again.'

    if (error.response) {
      // HTTP error response
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          errorType = 'validation'
          severity = 'low'
          message = data?.message || 'Bad request'
          userMessage = 'Please check your input and try again.'
          break
        case 401:
          errorType = 'authentication'
          severity = 'high'
          message = 'Unauthorized'
          userMessage = 'Please log in to continue.'
          break
        case 403:
          errorType = 'permission'
          severity = 'medium'
          message = 'Forbidden'
          userMessage = 'You don\'t have permission to perform this action.'
          break
        case 404:
          errorType = 'client'
          severity = 'low'
          message = 'Resource not found'
          userMessage = 'The requested item could not be found.'
          break
        case 429:
          errorType = 'client'
          severity = 'medium'
          message = 'Rate limit exceeded'
          userMessage = 'Too many requests. Please wait a moment and try again.'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = 'server'
          severity = 'high'
          message = 'Server error'
          userMessage = 'Server is temporarily unavailable. Please try again later.'
          break
        default:
          message = `HTTP ${status}: ${data?.message || 'Unknown error'}`
      }
    } else if (error.request) {
      // Network error
      errorType = 'network'
      severity = 'high'
      message = 'Network error'
      userMessage = 'Please check your internet connection and try again.'
    } else {
      // Other error
      message = error.message || 'Unknown error'
    }

    addError({
      message: context ? `${context}: ${message}` : message,
      type: errorType,
      severity,
      userMessage,
      details: error,
      code: error.code
    })
  }, [addError])

  return { handleApiError }
}

export default useErrorHandler