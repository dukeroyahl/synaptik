import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  code?: string
  details?: any
  context?: any
}

// Custom error classes
export class ValidationError extends Error implements AppError {
  statusCode = 400
  isOperational = true
  code = 'VALIDATION_ERROR'
  
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404
  isOperational = true
  code = 'NOT_FOUND'
  
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401
  isOperational = true
  code = 'UNAUTHORIZED'
  
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403
  isOperational = true
  code = 'FORBIDDEN'
  
  constructor(message: string = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409
  isOperational = true
  code = 'CONFLICT'
  
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends Error implements AppError {
  statusCode = 500
  isOperational = true
  code = 'DATABASE_ERROR'
  
  constructor(message: string = 'Database operation failed', public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Structured logging
interface ErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  error: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  request: {
    method: string
    url: string
    userAgent?: string
    ip?: string
    body?: any
    params?: any
    query?: any
  }
  context?: any
}

const logError = (error: AppError, req: Request, context?: any): void => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: error.statusCode && error.statusCode < 500 ? 'warn' : 'error',
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      ...(error.stack && { stack: error.stack }),
      ...(error.code && { code: error.code })
    },
    request: {
      method: req.method,
      url: req.url,
      ...(req.get('User-Agent') && { userAgent: req.get('User-Agent') }),
      ...(req.ip && { ip: req.ip }),
      ...(req.method !== 'GET' && req.body && { body: req.body }),
      ...(Object.keys(req.params).length > 0 && { params: req.params }),
      ...(Object.keys(req.query).length > 0 && { query: req.query })
    },
    context: context || error.context
  }

  // In production, you would send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: logger.error(errorLog)
    console.error(JSON.stringify(errorLog))
  } else {
    console.error('Error Details:', errorLog)
  }
}

// Handle different types of errors
const handleCastError = (error: any): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`
  return new ValidationError(message)
}

const handleDuplicateFieldsError = (error: any): AppError => {
  const keys = Object.keys(error.keyValue || {})
  const field = keys.length > 0 ? keys[0] : 'field'
  const value = error.keyValue && field ? error.keyValue[field] : 'unknown'
  const message = `${field || 'Field'} '${value || 'unknown'}' already exists`
  return new ConflictError(message)
}

const handleValidationError = (error: any): AppError => {
  const errors = Object.values(error.errors).map((err: any) => err.message)
  const message = `Validation failed: ${errors.join('. ')}`
  return new ValidationError(message, errors)
}

const handleJWTError = (): AppError => {
  return new UnauthorizedError('Invalid token. Please log in again')
}

const handleJWTExpiredError = (): AppError => {
  return new UnauthorizedError('Token expired. Please log in again')
}

// Main error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError = { ...err }
  error.message = err.message

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastError(err)
  if (err.code === 11000) error = handleDuplicateFieldsError(err)
  if (err.name === 'ValidationError') error = handleValidationError(err)
  if (err.name === 'JsonWebTokenError') error = handleJWTError()
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

  // Set default values
  const statusCode = error.statusCode || 500
  const isOperational = error.isOperational || false

  // Log the error
  logError(error, req)

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.details && { details: error.details })
    }
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack
  }

  // Include request ID for tracking
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id']
  }

  res.status(statusCode).json(errorResponse)
}

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`)
  next(error)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Legacy export for compatibility
export interface CustomError extends AppError {}