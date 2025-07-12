import { Router, Request, Response } from 'express'
import Mindmap from '../models/Mindmap'
import Project from '../models/Project'
import Joi from 'joi'
import { asyncHandler, NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler'

const router = Router()

// Validation schemas
const nodeSchema = Joi.object({
  id: Joi.string().required(),
  label: Joi.string().max(100).required(),
  x: Joi.number().required(),
  y: Joi.number().required(),
  type: Joi.string().valid('root', 'topic', 'subtopic', 'note').default('topic'),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  size: Joi.number().min(10).max(100).default(20),
  data: Joi.any().optional()
})

const edgeSchema = Joi.object({
  id: Joi.string().required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
  type: Joi.string().valid('default', 'arrow', 'smooth').default('default'),
  label: Joi.string().max(50).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional()
})

const createMindmapSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).optional(),
  nodes: Joi.array().items(nodeSchema).default([]),
  edges: Joi.array().items(edgeSchema).default([]),
  projectId: Joi.string().optional(),
  isPublic: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([])
})

const updateMindmapSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).optional(),
  nodes: Joi.array().items(nodeSchema).optional(),
  edges: Joi.array().items(edgeSchema).optional(),
  projectId: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).optional()
}).min(1)

// Get all mindmaps
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { 
    projectId, 
    isPublic, 
    tags, 
    limit = '50', 
    sortBy = 'updatedAt', 
    sortOrder = 'desc' 
  } = req.query

  // Build filter
  const filter: any = {}
  if (projectId) filter.projectId = projectId
  if (isPublic !== undefined) filter.isPublic = isPublic === 'true'
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim())
    filter.tags = { $in: tagArray }
  }

  // Build sort
  const sort: any = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const mindmaps = await Mindmap.find(filter)
    .sort(sort)
    .limit(parseInt(limit as string))
    .populate('projectId', 'name status priority')
    .select('-nodes -edges') // Exclude large fields for list view

  res.json({ 
    data: mindmaps,
    count: mindmaps.length 
  })
}))

// Get mindmap by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const mindmap = await Mindmap.findById(id).populate('projectId', 'name status priority')
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  res.json({ data: mindmap })
}))

// Create new mindmap
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createMindmapSchema.validate(req.body)
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  // Validate project exists if projectId provided
  if (value.projectId) {
    const project = await Project.findById(value.projectId)
    if (!project) {
      throw new NotFoundError('Project')
    }
  }

  const mindmap = new Mindmap(value)
  await mindmap.save()

  // Update project mindmapId if project is specified
  if (value.projectId) {
    await Project.findByIdAndUpdate(
      value.projectId,
      { mindmapId: mindmap._id }
    )
  }

  res.status(201).json({ 
    data: mindmap,
    message: 'Mindmap created successfully' 
  })
}))

// Update mindmap
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { error, value } = updateMindmapSchema.validate(req.body)
  
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  // Validate project exists if projectId provided
  if (value.projectId) {
    const project = await Project.findById(value.projectId)
    if (!project) {
      throw new NotFoundError('Project')
    }
  }

  const mindmap = await Mindmap.findByIdAndUpdate(
    id,
    { ...value, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('projectId', 'name status priority')

  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  res.json({ 
    data: mindmap,
    message: 'Mindmap updated successfully' 
  })
}))

// Delete mindmap
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const mindmap = await Mindmap.findByIdAndDelete(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  // Remove mindmapId from associated project
  if (mindmap.projectId) {
    await Project.findByIdAndUpdate(
      mindmap.projectId,
      { $unset: { mindmapId: 1 } }
    )
  }

  res.json({ 
    data: mindmap,
    message: 'Mindmap deleted successfully' 
  })
}))

// Add node to mindmap
router.post('/:id/nodes', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { error, value } = nodeSchema.validate(req.body)
  
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  const mindmap = await Mindmap.findById(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  try {
    await (mindmap as any).addNode(value)
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      throw new ConflictError(error.message)
    }
    throw error
  }

  res.json({ 
    data: mindmap,
    message: 'Node added successfully' 
  })
}))

// Update node in mindmap
router.put('/:id/nodes/:nodeId', asyncHandler(async (req: Request, res: Response) => {
  const { id, nodeId } = req.params
  
  const mindmap = await Mindmap.findById(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  try {
    await (mindmap as any).updateNode(nodeId, req.body)
  } catch (error: any) {
    if (error.message.includes('not found')) {
      throw new NotFoundError('Node')
    }
    throw error
  }

  res.json({ 
    data: mindmap,
    message: 'Node updated successfully' 
  })
}))

// Remove node from mindmap
router.delete('/:id/nodes/:nodeId', asyncHandler(async (req: Request, res: Response) => {
  const { id, nodeId } = req.params
  
  const mindmap = await Mindmap.findById(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  await (mindmap as any).removeNode(nodeId)

  res.json({ 
    data: mindmap,
    message: 'Node removed successfully' 
  })
}))

// Add edge to mindmap
router.post('/:id/edges', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { error, value } = edgeSchema.validate(req.body)
  
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  const mindmap = await Mindmap.findById(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  try {
    await (mindmap as any).addEdge(value)
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('must reference')) {
      throw new ValidationError(error.message)
    }
    throw error
  }

  res.json({ 
    data: mindmap,
    message: 'Edge added successfully' 
  })
}))

// Remove edge from mindmap
router.delete('/:id/edges/:edgeId', asyncHandler(async (req: Request, res: Response) => {
  const { id, edgeId } = req.params
  
  const mindmap = await Mindmap.findById(id)
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  await (mindmap as any).removeEdge(edgeId)

  res.json({ 
    data: mindmap,
    message: 'Edge removed successfully' 
  })
}))

// Export mindmap to various formats
router.get('/:id/export/:format', asyncHandler(async (req: Request, res: Response) => {
  const { id, format } = req.params
  
  const mindmap = await Mindmap.findById(id).populate('projectId', 'name')
  if (!mindmap) {
    throw new NotFoundError('Mindmap')
  }

  switch (format.toLowerCase()) {
    case 'json':
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${mindmap.title}.json"`)
      return res.json(mindmap)
      
    case 'csv':
      // Export nodes as CSV
      const csvHeader = 'id,label,x,y,type,color,size\n'
      const csvRows = mindmap.nodes.map(node => 
        `"${node.id}","${node.label}",${node.x},${node.y},"${node.type}","${node.color || ''}",${node.size || 20}`
      ).join('\n')
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${mindmap.title}_nodes.csv"`)
      return res.send(csvHeader + csvRows)
      
    default:
      throw new ValidationError('Unsupported export format. Supported: json, csv')
  }
}))

export { router as mindmapRoutes }