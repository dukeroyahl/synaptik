import Joi from 'joi'
import { commonSchemas } from '../middleware/validation'

// Task validation schemas
export const taskSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional(),
    status: commonSchemas.status.default('pending'),
    priority: commonSchemas.priority,
    project: Joi.string().trim().max(100).optional(),
    assignee: Joi.string().trim().max(100).optional(),
    dueDate: Joi.date().iso().optional(),
    waitUntil: Joi.date().iso().optional(),
    tags: commonSchemas.tags,
    depends: Joi.array().items(commonSchemas.objectId).max(20).unique().default([]),
    scheduledDate: Joi.date().iso().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional()
  }).custom((value, helpers) => {
    // Custom validation: dueDate should be after waitUntil
    if (value.waitUntil && value.dueDate && new Date(value.waitUntil) > new Date(value.dueDate)) {
      return helpers.error('custom.dueAfterWait')
    }
    return value
  }).messages({
    'custom.dueAfterWait': 'Due date must be after wait until date'
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).optional(),
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    project: Joi.string().trim().max(100).optional(),
    assignee: Joi.string().trim().max(100).optional(),
    dueDate: Joi.date().iso().optional(),
    waitUntil: Joi.date().iso().optional(),
    tags: commonSchemas.tags.optional(),
    depends: Joi.array().items(commonSchemas.objectId).max(20).unique().optional(),
    scheduledDate: Joi.date().iso().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  }).min(1).custom((value, helpers) => {
    // Custom validation: dueDate should be after waitUntil
    if (value.waitUntil && value.dueDate && new Date(value.waitUntil) > new Date(value.dueDate)) {
      return helpers.error('custom.dueAfterWait')
    }
    // Custom validation: endDate should be after startDate
    if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.error('custom.endAfterStart')
    }
    return value
  }).messages({
    'custom.dueAfterWait': 'Due date must be after wait until date',
    'custom.endAfterStart': 'End date must be after start date'
  }),

  quickCapture: Joi.object({
    input: Joi.string().trim().min(1).max(500).required()
      .description('TaskWarrior-style input string')
  }),

  filter: Joi.object({
    status: commonSchemas.status.optional(),
    priority: commonSchemas.priority.optional(),
    project: Joi.string().trim().max(100).optional(),
    assignee: Joi.string().trim().max(100).optional(),
    tags: Joi.string().optional(), // Comma-separated tags
    dueBefore: Joi.date().iso().optional(),
    dueAfter: Joi.date().iso().optional(),
    createdAfter: Joi.date().iso().optional(),
    createdBefore: Joi.date().iso().optional(),
    hasDescription: Joi.boolean().optional(),
    hasDueDate: Joi.boolean().optional(),
    limit: Joi.number().integer().min(1).max(200).default(50),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'urgency', 'dueDate', 'priority').default('urgency'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }).custom((value, helpers) => {
    // Validate date ranges
    if (value.dueAfter && value.dueBefore && new Date(value.dueAfter) >= new Date(value.dueBefore)) {
      return helpers.error('custom.dueDateRange')
    }
    if (value.createdAfter && value.createdBefore && new Date(value.createdAfter) >= new Date(value.createdBefore)) {
      return helpers.error('custom.createdDateRange')
    }
    return value
  }).messages({
    'custom.dueDateRange': 'Due date "after" must be before "before" date',
    'custom.createdDateRange': 'Created date "after" must be before "before" date'
  }),

  annotation: Joi.object({
    description: Joi.string().trim().min(1).max(500).required()
  })
}

// Project validation schemas
export const projectSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional(),
    status: commonSchemas.projectStatus.default('planning'),
    priority: commonSchemas.projectPriority.default('medium'),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
    progress: Joi.number().min(0).max(100).default(0),
    mindmapId: commonSchemas.objectId.optional(),
    tags: commonSchemas.tags,
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).optional(),
    status: commonSchemas.projectStatus.optional(),
    priority: commonSchemas.projectPriority.optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    progress: Joi.number().min(0).max(100).optional(),
    mindmapId: commonSchemas.objectId.optional(),
    tags: commonSchemas.tags.optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
  }).min(1).custom((value, helpers) => {
    // Custom validation: endDate should be after startDate
    if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.error('custom.endAfterStart')
    }
    return value
  }).messages({
    'custom.endAfterStart': 'End date must be after start date'
  }),

  filter: Joi.object({
    status: commonSchemas.projectStatus.optional(),
    priority: commonSchemas.projectPriority.optional(),
    tags: Joi.string().optional(), // Comma-separated tags
    startAfter: Joi.date().iso().optional(),
    startBefore: Joi.date().iso().optional(),
    endAfter: Joi.date().iso().optional(),
    endBefore: Joi.date().iso().optional(),
    progressMin: Joi.number().min(0).max(100).optional(),
    progressMax: Joi.number().min(0).max(100).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'priority', 'startDate', 'endDate', 'progress').default('updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }).custom((value, helpers) => {
    // Validate progress range
    if (value.progressMin && value.progressMax && value.progressMin > value.progressMax) {
      return helpers.error('custom.progressRange')
    }
    return value
  }).messages({
    'custom.progressRange': 'Progress minimum must be less than maximum'
  })
}

// Mindmap validation schemas
export const mindmapSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).optional(),
    nodes: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        label: Joi.string().max(100).required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        type: Joi.string().valid('root', 'topic', 'subtopic', 'note').default('topic'),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
        size: Joi.number().min(10).max(100).default(20),
        data: Joi.any().optional()
      })
    ).default([]),
    edges: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        source: Joi.string().required(),
        target: Joi.string().required(),
        type: Joi.string().valid('default', 'arrow', 'smooth').default('default'),
        label: Joi.string().max(50).optional(),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
      })
    ).default([]),
    projectId: commonSchemas.objectId.optional(),
    isPublic: Joi.boolean().default(false),
    tags: commonSchemas.tags
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).optional(),
    nodes: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        label: Joi.string().max(100).required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        type: Joi.string().valid('root', 'topic', 'subtopic', 'note').default('topic'),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
        size: Joi.number().min(10).max(100).default(20),
        data: Joi.any().optional()
      })
    ).optional(),
    edges: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        source: Joi.string().required(),
        target: Joi.string().required(),
        type: Joi.string().valid('default', 'arrow', 'smooth').default('default'),
        label: Joi.string().max(50).optional(),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
      })
    ).optional(),
    projectId: commonSchemas.objectId.optional(),
    isPublic: Joi.boolean().optional(),
    tags: commonSchemas.tags.optional()
  }).min(1),

  filter: Joi.object({
    projectId: commonSchemas.objectId.optional(),
    isPublic: Joi.boolean().optional(),
    tags: Joi.string().optional(), // Comma-separated tags
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title').default('updatedAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
}

// Parameter validation schemas
export const paramSchemas = {
  id: Joi.object({
    id: commonSchemas.objectId.required()
  }),

  idAndNodeId: Joi.object({
    id: commonSchemas.objectId.required(),
    nodeId: Joi.string().required()
  }),

  idAndEdgeId: Joi.object({
    id: commonSchemas.objectId.required(),
    edgeId: Joi.string().required()
  }),

  exportFormat: Joi.object({
    id: commonSchemas.objectId.required(),
    format: Joi.string().valid('json', 'csv', 'xml').required()
  })
}