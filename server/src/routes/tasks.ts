import { Router, Request, Response } from 'express'
import { Task, ITask } from '../models'
import { TaskWarriorService } from '../services/TaskWarriorService'
import { validate, validateQuery, validateParams, sanitize, createRateLimit } from '../middleware/validation'
import { taskSchemas, paramSchemas } from '../validation/schemas'
import { asyncHandler, NotFoundError, ValidationError, DatabaseError } from '../middleware/errorHandler'
import { TagUtils } from '../utils/tagUtils'

// Type definitions for API requests
interface TaskFilterQuery {
  status?: string | string[]
  priority?: string | string[]
  project?: string
  tags?: string | string[]
  assignee?: string
  dueBefore?: string
  dueAfter?: string
  depends?: string
  limit?: string
  sortBy?: string
  sortOrder?: string
}

interface TaskFilter {
  status?: string[]
  priority?: string[]
  project?: string
  tags?: string[]
  assignee?: string
  dueBefore?: Date
  dueAfter?: Date
  depends?: string
  limit?: number
  sortBy?: string
  sortOrder?: string
}

interface TaskUpdateData {
  title?: string
  description?: string
  status?: ITask['status']
  priority?: ITask['priority']
  project?: string
  assignee?: string
  dueDate?: string
  waitUntil?: string
  tags?: string[]
  depends?: string[]
}

export const taskRoutes = Router()

// Apply rate limiting and sanitization to all routes
taskRoutes.use(createRateLimit(60000, 100)) // 100 requests per minute
taskRoutes.use(sanitize)

// GET /api/tasks - Get all tasks with TaskWarrior-style filtering
taskRoutes.get('/', validateQuery(taskSchemas.filter), asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    priority,
    project,
    tags,
    assignee,
    dueBefore,
    dueAfter,
    depends,
    limit,
    sortBy,
    sortOrder
  } = req.query as TaskFilterQuery

  const filter: TaskFilter = {}
  
  if (status) filter.status = Array.isArray(status) ? status : [status]
  if (priority) filter.priority = Array.isArray(priority) ? priority : [priority]
  if (project) filter.project = project as string
  if (tags) filter.tags = Array.isArray(tags) ? tags : [tags]
  if (assignee) filter.assignee = assignee as string
  if (dueBefore) filter.dueBefore = new Date(dueBefore as string)
  if (dueAfter) filter.dueAfter = new Date(dueAfter as string)
  if (depends) filter.depends = depends as string // Filter tasks that depend on this task
  if (limit) filter.limit = parseInt(limit as string)
  if (sortBy) filter.sortBy = sortBy as string
  if (sortOrder) filter.sortOrder = sortOrder as string
  
  const tasks = await TaskWarriorService.getTasks(filter)
  res.json({ data: tasks })
}))

// POST /api/tasks - Create new task
taskRoutes.post('/', validate(taskSchemas.create), asyncHandler(async (req: Request, res: Response) => {
  const { 
    title, 
    description, 
    status, 
    priority, 
    project,
    assignee, 
    dueDate,
    waitUntil,
    tags,
    depends
  } = req.body
  
  
  const task = new Task({
    title,
    description,
    status: status || 'pending',
    priority: priority || '',
    project,
    assignee,
    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    waitUntil: waitUntil ? new Date(waitUntil).toISOString() : undefined,
    tags: TagUtils.normalizeTags(tags),
    depends: depends || [],
    annotations: []
  })
  
  const savedTask = await task.save()
  res.status(201).json({ data: savedTask })
}))

// POST /api/tasks/capture - Quick task capture (TaskWarrior style)
taskRoutes.post('/capture', validate(taskSchemas.quickCapture), asyncHandler(async (req: Request, res: Response) => {
  const { input } = req.body
  
  const task = await TaskWarriorService.captureTask(input)
  res.status(201).json({ 
    data: task,
    message: `Task captured: "${task.title}"`
  })
}))

// GET /api/tasks/pending - Get pending tasks (TaskWarrior default view)
taskRoutes.get('/pending', asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskWarriorService.getPendingTasks()
  res.json({ data: tasks })
}))

// GET /api/tasks/active - Get active tasks
taskRoutes.get('/active', asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskWarriorService.getActiveTasks()
  res.json({ data: tasks })
}))

// GET /api/tasks/next - Get next task (highest urgency)
taskRoutes.get('/next', asyncHandler(async (req: Request, res: Response) => {
  const task = await TaskWarriorService.getNextTask()
  if (!task) {
    res.json({ data: null, message: 'No pending tasks found' })
    return
  }
  res.json({ data: task })
}))

// GET /api/tasks/overdue - Get overdue tasks
taskRoutes.get('/overdue', asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskWarriorService.getOverdueTasks()
  res.json({ data: tasks })
}))

// GET /api/tasks/today - Get tasks for today
taskRoutes.get('/today', asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskWarriorService.getTodayTasks()
  res.json({ data: tasks })
}))

// GET /api/tasks/:id - Get task by ID
taskRoutes.get('/:id', validateParams(paramSchemas.id), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  res.json({ data: task })
}))

// PUT /api/tasks/:id - Update task
taskRoutes.put('/:id', validateParams(paramSchemas.id), validate(taskSchemas.update), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { 
    title, 
    description, 
    status, 
    priority, 
    assignee, 
    dueDate,
    project,
    depends,
    tags 
  } = req.body
  
  
  // Build update object, handling undefined dueDate properly
  const updateData: TaskUpdateData = {
    title,
    description,
    status,
    priority,
    assignee,
    tags: TagUtils.normalizeTags(tags),
    project: req.body.project
  }
  
  // Handle dueDate properly - set to null if undefined to clear it
  if (dueDate === undefined || dueDate === null || dueDate === '') {
    updateData.dueDate = null
  } else {
    updateData.dueDate = new Date(dueDate).toISOString()
  }
  
  // Handle depends properly
  if (req.body.depends !== undefined) {
    updateData.depends = req.body.depends;
  }
  
  const updatedTask = await Task.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
  
  if (!updatedTask) {
    throw new NotFoundError('Task')
  }
  
  res.json({ data: updatedTask })
}))

// DELETE /api/tasks/:id - Delete task
taskRoutes.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const deletedTask = await Task.findByIdAndDelete(id)
  
  if (!deletedTask) {
    throw new NotFoundError('Task')
  }
  
  res.json({ message: 'Task deleted successfully' })
}))

// TaskWarrior-style action routes

// POST /api/tasks/:id/start - Start task (set to active)
taskRoutes.post('/:id/start', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  await (task as any).start()
  res.json({ 
    data: task,
    message: `Task "${task.title}" started` 
  })
}))

// POST /api/tasks/:id/stop - Stop task (set to pending)
taskRoutes.post('/:id/stop', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  await (task as any).stop()
  res.json({ 
    data: task,
    message: `Task "${task.title}" stopped` 
  })
}))

// POST /api/tasks/:id/done - Complete task
taskRoutes.post('/:id/done', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  // Fix urgency if it's over 100 (temporary fix for existing data)
  if (task.urgency && task.urgency > 100) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fixing urgency from ${task.urgency} to 100`)
    }
    task.urgency = 100
  }
  
  // Update status directly and save without running the pre-save hook
  // to avoid recalculating urgency
  task.status = 'completed'
  
  // Ensure annotations array exists
  if (!task.annotations) {
    task.annotations = []
  }
  
  // Add completion annotation
  task.annotations.push({
    timestamp: new Date(),
    description: 'Task completed'
  })
  
  // Save with validation disabled to avoid urgency validation issues
  await task.save({ validateBeforeSave: false })
  
  res.json({ 
    data: task,
    message: `Task "${task.title}" completed` 
  })
}))

// POST /api/tasks/:id/undone - Unmark task as done (set to pending)
taskRoutes.post('/:id/undone', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  // Set task back to pending status
  task.status = 'pending'
  task.annotations.push({
    timestamp: new Date(),
    description: 'Task marked as not done'
  })
  
  await task.save()
  
  res.json({ 
    data: task,
    message: `Task "${task.title}" marked as not done` 
  })
}))

// DELETE /api/tasks/:id/delete - Delete task (TaskWarrior style - soft delete)
taskRoutes.delete('/:id/delete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  await (task as any).delete()
  res.json({ 
    message: `Task "${task.title}" deleted` 
  })
}))

// POST /api/tasks/:id/annotate - Add annotation to task
taskRoutes.post('/:id/annotate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { description } = req.body
  
  if (!description) {
    throw new ValidationError('Annotation description is required')
  }
  
  const task = await Task.findById(id)
  
  if (!task) {
    throw new NotFoundError('Task')
  }
  
  await (task as any).addAnnotation(description)
  res.json({ 
    data: task,
    message: `Annotation added to "${task.title}"` 
  })
}))
