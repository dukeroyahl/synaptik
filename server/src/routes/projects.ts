import { Router, Request, Response } from 'express'
import Project, { IProject } from '../models/Project'
import Task from '../models/Task'
import Joi from 'joi'
import { asyncHandler, NotFoundError, ValidationError, DatabaseError } from '../middleware/errorHandler'

// Type definitions for API requests
interface ProjectFilterQuery {
  status?: string
  priority?: string
  limit?: string
  sortBy?: string
  sortOrder?: string
}

interface ProjectFilter {
  status?: IProject['status']
  priority?: IProject['priority']
}

interface ProjectSortOptions {
  [key: string]: 1 | -1
}

interface TaskFilter {
  project?: string
}

interface TaskSortOptions {
  [key: string]: 1 | -1
}

const router = Router()

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).optional(),
  status: Joi.string().valid('planning', 'active', 'completed', 'on-hold').default('planning'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  progress: Joi.number().min(0).max(100).default(0),
  mindmapId: Joi.string().optional()
})

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(1000).optional(),
  status: Joi.string().valid('planning', 'active', 'completed', 'on-hold').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  progress: Joi.number().min(0).max(100).optional(),
  mindmapId: Joi.string().optional()
}).min(1)

// Get all projects
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, limit = '50', sortBy = 'updatedAt', sortOrder = 'desc' } = req.query as ProjectFilterQuery

  // Build filter
  const filter: ProjectFilter = {}
  if (status) filter.status = status as IProject['status']
  if (priority) filter.priority = priority as IProject['priority']

  // Build sort
  const sort: ProjectSortOptions = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const projects = await Project.find(filter)
    .sort(sort)
    .limit(parseInt(limit as string))
    .populate('mindmapId', 'title')

  res.json({ 
    data: projects,
    count: projects.length 
  })
}))

// Get project by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const project = await Project.findById(id).populate('mindmapId', 'title')
  if (!project) {
    throw new NotFoundError('Project')
  }

  res.json({ data: project })
}))

// Create new project
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createProjectSchema.validate(req.body)
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  const project = new Project(value)
  await project.save()

  res.status(201).json({ 
    data: project,
    message: 'Project created successfully' 
  })
}))

// Update project
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { error, value } = updateProjectSchema.validate(req.body)
  
  if (error) {
    throw new ValidationError('Validation error', error.details.map(d => d.message))
  }

  // Validate endDate is after startDate if both are provided
  if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
    throw new ValidationError('End date must be after start date')
  }

  const project = await Project.findByIdAndUpdate(
    id,
    { ...value, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('mindmapId', 'title')

  if (!project) {
    throw new NotFoundError('Project')
  }

  res.json({ 
    data: project,
    message: 'Project updated successfully' 
  })
}))

// Delete project
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  const project = await Project.findByIdAndDelete(id)
  if (!project) {
    throw new NotFoundError('Project')
  }

  // Update tasks that reference this project to remove the project reference
  await Task.updateMany(
    { project: project.name },
    { $unset: { project: 1 } }
  )

  res.json({ 
    data: project,
    message: 'Project deleted successfully' 
  })
}))

// Get tasks for a project
router.get('/:id/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const project = await Project.findById(id)
  if (!project) {
    throw new NotFoundError('Project')
  }

  const { status, priority, limit = '50', sortBy = 'urgency', sortOrder = 'desc' } = req.query

  // Build filter for tasks
  const filter: any = { project: project.name }
  if (status) filter.status = status
  if (priority) filter.priority = priority

  // Build sort
  const sort: any = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const tasks = await Task.find(filter)
    .sort(sort)
    .limit(parseInt(limit as string))

  res.json({ 
    data: tasks,
    count: tasks.length,
    project: {
      id: project.id,
      name: project.name
    }
  })
}))

// Update project progress based on task completion
router.post('/:id/calculate-progress', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const project = await Project.findById(id)
  if (!project) {
    throw new NotFoundError('Project')
  }

  // Get all tasks for this project
  const allTasks = await Task.find({ 
    project: project.name,
    status: { $ne: 'deleted' }
  })

  if (allTasks.length === 0) {
    project.progress = 0
  } else {
    const completedTasks = allTasks.filter(task => task.status === 'completed').length
    project.progress = Math.round((completedTasks / allTasks.length) * 100)
  }

  await project.save()

  res.json({ 
    data: project,
    message: 'Project progress updated successfully',
    stats: {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(task => task.status === 'completed').length,
      activeTasks: allTasks.filter(task => task.status === 'active').length,
      pendingTasks: allTasks.filter(task => task.status === 'pending').length
    }
  })
}))

// Get project statistics
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  const project = await Project.findById(id)
  if (!project) {
    throw new NotFoundError('Project')
  }

  // Get task statistics
  const taskStats = await Task.aggregate([
    { $match: { project: project.name, status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgUrgency: { $avg: '$urgency' }
      }
    }
  ])

  // Get priority distribution
  const priorityStats = await Task.aggregate([
    { $match: { project: project.name, status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ])

  // Calculate project health score
  const totalTasks = await Task.countDocuments({ 
    project: project.name, 
    status: { $ne: 'deleted' } 
  })
  const overdueTasks = await Task.countDocuments({ 
    project: project.name, 
    status: { $nin: ['deleted', 'completed'] },
    dueDate: { $lt: new Date().toISOString() }
  })
  
  const healthScore = totalTasks > 0 ? 
    Math.round((1 - (overdueTasks / totalTasks)) * 100) : 100

  res.json({
    data: {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress
      },
      tasks: {
        total: totalTasks,
        byStatus: taskStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, avgUrgency: stat.avgUrgency }
          return acc
        }, {}),
        byPriority: priorityStats.reduce((acc, stat) => {
          acc[stat._id || 'none'] = stat.count
          return acc
        }, {}),
        overdue: overdueTasks
      },
      healthScore
    }
  })
}))

export { router as projectRoutes }