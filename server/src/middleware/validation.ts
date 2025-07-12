import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

// Custom validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Get all validation errors
      stripUnknown: true, // Remove unknown properties
      allowUnknown: false
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
        message: 'Please check the provided data and try again'
      })
      return
    }

    // Replace req.body with validated and sanitized data
    req.body = value
    next()
  }
}

// Query parameter validation
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      res.status(400).json({
        error: 'Query validation failed',
        details: errorDetails,
        message: 'Please check the query parameters and try again'
      })
      return
    }

    req.query = value
    next()
  }
}

// Parameter validation
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      res.status(400).json({
        error: 'Parameter validation failed',
        details: errorDetails,
        message: 'Please check the URL parameters and try again'
      })
      return
    }

    req.params = value
    next()
  }
}

// Rate limiting middleware
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    
    const clientData = requests.get(clientId)
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize client data
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      })
      next()
    } else if (clientData.count < max) {
      // Increment counter
      clientData.count++
      next()
    } else {
      // Rate limit exceeded
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || `Too many requests. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      })
    }
  }
}

// Input sanitization
export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potential XSS vectors
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue)
    } else if (value && typeof value === 'object') {
      const sanitized: any = {}
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val)
      }
      return sanitized
    }
    return value
  }

  req.body = sanitizeValue(req.body)
  next()
}

// Common validation schemas
export const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Must be a valid MongoDB ObjectId'),
  
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'name', 'priority', 'urgency', 'dueDate').default('updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }),

  tags: Joi.array().items(
    Joi.string().trim().min(1).max(50).pattern(/^[a-zA-Z0-9_-]+$/)
  ).max(20).unique(),

  priority: Joi.string().valid('H', 'M', 'L', '').default(''),
  
  status: Joi.string().valid('pending', 'waiting', 'active', 'completed', 'deleted'),

  projectStatus: Joi.string().valid('planning', 'active', 'completed', 'on-hold'),

  projectPriority: Joi.string().valid('low', 'medium', 'high')
}