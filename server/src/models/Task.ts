import mongoose, { Schema, Document } from 'mongoose'
import { TagUtils } from '../utils/tagUtils'

export interface ITask extends Document {
  _id: string
  title: string
  description?: string
  status: 'pending' | 'waiting' | 'active' | 'completed' | 'deleted'
  priority: 'H' | 'M' | 'L' | ''
  urgency?: number
  project?: string
  assignee?: string
  dueDate?: string | undefined // Date string (ISO format)
  waitUntil?: string | undefined // Date string (ISO format)
  tags: string[]
  annotations: Array<{
    timestamp: Date
    description: string
  }>
  depends: string[]
  createdAt: Date
  updatedAt: Date
}

const TaskSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'waiting', 'active', 'completed', 'deleted'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['H', 'M', 'L', ''],
    default: ''
  },
  urgency: {
    type: Number,
    min: 0,
    max: 100
  },
  project: {
    type: String,
    trim: true
  },
  assignee: {
    type: String,
    trim: true
  },
  dueDate: {
    type: String,
    validate: {
      validator: function(v: string) {
        // Allow ISO date strings or YYYY-MM-DD format
        return !v || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(v);
      },
      message: 'dueDate must be in ISO date format or YYYY-MM-DD format'
    }
  },
  waitUntil: {
    type: String,
    validate: {
      validator: function(v: string) {
        // Allow ISO date strings or YYYY-MM-DD format
        return !v || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(v);
      },
      message: 'waitUntil must be in ISO date format or YYYY-MM-DD format'
    }
  },
  tags: {
    type: [{
      type: String,
      trim: true
    }],
    default: [],
    set: function(tags: string[]) {
      return TagUtils.normalizeTags(tags)
    }
  },
  annotations: {
    type: [{
      timestamp: { type: Date, default: Date.now },
      description: { type: String, required: true }
    }],
    default: []
  },
  depends: {
    type: [{
      type: String
    }],
    default: []
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Pre-save middleware to calculate urgency
TaskSchema.pre('save', function(this: ITask, next) {
  // Validate date strings
  if (this.dueDate) {
    if (typeof this.dueDate !== 'string' || !this.dueDate.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Task ${this.title}: Invalid due date, clearing it`)
      }
      this.dueDate = undefined
    } else {
      // Try to parse the date to ensure it's valid
      const parsedDate = new Date(this.dueDate)
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000 || parsedDate.getFullYear() > 2100) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Task ${this.title}: Invalid due date ${this.dueDate}, clearing it`)
        }
        this.dueDate = undefined
      }
    }
  }
  
  if (this.waitUntil) {
    if (typeof this.waitUntil !== 'string' || !this.waitUntil.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Task ${this.title}: Invalid waitUntil date, clearing it`)
      }
      this.waitUntil = undefined
    } else {
      // Try to parse the date to ensure it's valid
      const parsedDate = new Date(this.waitUntil)
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000 || parsedDate.getFullYear() > 2100) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Task ${this.title}: Invalid waitUntil date ${this.waitUntil}, clearing it`)
        }
        this.waitUntil = undefined
      }
    }
  }
  
  // Calculate urgency safely
  try {
    this.urgency = (this as any).calculateUrgency()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Task ${this.title}: Error calculating urgency, setting to 5:`, error)
    }
    this.urgency = 5
  }
  
  next()
})

// Method to calculate urgency (TaskWarrior-inspired)
TaskSchema.methods.calculateUrgency = function() {
  let urgency = 0
  
  // Priority component
  if (this.priority === 'H') urgency += 6
  else if (this.priority === 'M') urgency += 3.9
  else if (this.priority === 'L') urgency += 1.8
  
  // Due date component
  if (this.dueDate) {
    const now = new Date()
    // Parse the date string
    const dueDateObj = new Date(this.dueDate)
    
    // Skip if invalid date
    if (isNaN(dueDateObj.getTime())) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Task urgency calculation: Invalid due date ${this.dueDate}`)
      }
    } else {
      const daysUntilDue = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue < 0) {
        // Overdue
        urgency += 12 + Math.abs(daysUntilDue) * 0.2
      } else if (daysUntilDue <= 7) {
        // Due within a week
        urgency += 12 - (daysUntilDue * 1.4)
      } else if (daysUntilDue <= 14) {
        // Due within two weeks
        urgency += 5 - (daysUntilDue * 0.3)
      }
    }
  }
  
  // Age component (older tasks are more urgent)
  if (this.createdAt) {
    const ageInDays = Math.ceil((new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    urgency += ageInDays * 0.01
  }
  
  // Active status boost
  if (this.status === 'active') urgency += 4
  
  // Waiting penalty
  if (this.status === 'waiting') urgency -= 3
  
  // Tags boost
  if (this.tags.includes('urgent')) urgency += 5
  if (this.tags.includes('important')) urgency += 3
  
  // Cap urgency at a reasonable maximum to prevent validation errors
  const cappedUrgency = Math.min(100, Math.max(0, Math.round(urgency * 100) / 100))
  
  return cappedUrgency
}

// Method to add annotation
TaskSchema.methods.addAnnotation = function(description: string) {
  // Ensure annotations array exists
  if (!this.annotations) {
    this.annotations = [];
  }
  
  this.annotations.push({
    timestamp: new Date(),
    description: description
  });
  // Don't save here, let the calling method handle saving
}

// Method to start task (set to active)
TaskSchema.methods.start = function() {
  this.status = 'active'
  this.addAnnotation('Task started')
  return this.save()
}

// Method to stop task (set to pending)
TaskSchema.methods.stop = function() {
  if (this.status === 'active') {
    this.status = 'pending'
    this.addAnnotation('Task stopped')
  }
  return this.save()
}

// Method to complete task
TaskSchema.methods.done = function() {
  try {
    this.status = 'completed';
    
    // Ensure annotations array exists
    if (!this.annotations) {
      this.annotations = [];
    }
    
    // Add annotation directly without calling addAnnotation method
    this.annotations.push({
      timestamp: new Date(),
      description: 'Task completed'
    });
    
    return this.save();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in done() method:', error);
    }
    throw error;
  }
}

// Method to delete task
TaskSchema.methods.delete = function() {
  this.status = 'deleted'
  this.addAnnotation('Task deleted')
  return this.save()
}

// Optimized compound indexes for common query patterns
TaskSchema.index({ status: 1, urgency: -1 }) // Most common: filter by status, sort by urgency
TaskSchema.index({ status: 1, priority: 1, urgency: -1 }) // Filter by status and priority, sort by urgency
TaskSchema.index({ assignee: 1, status: 1, urgency: -1 }) // Tasks by assignee and status
TaskSchema.index({ project: 1, status: 1, urgency: -1 }) // Tasks by project and status
TaskSchema.index({ dueDate: 1, status: 1 }) // Due date queries with status filter
TaskSchema.index({ status: 1, dueDate: 1 }) // Status with due date sort
TaskSchema.index({ tags: 1, status: 1 }) // Tag-based queries with status
TaskSchema.index({ createdAt: -1 }) // Recent tasks
TaskSchema.index({ updatedAt: -1 }) // Recently modified tasks

// Sparse indexes for optional fields
TaskSchema.index({ dueDate: 1 }, { sparse: true }) // Only index documents with dueDate
TaskSchema.index({ waitUntil: 1 }, { sparse: true }) // Only index documents with waitUntil
TaskSchema.index({ assignee: 1 }, { sparse: true }) // Only index documents with assignee
TaskSchema.index({ project: 1 }, { sparse: true }) // Only index documents with project

// Text search index with weights
TaskSchema.index(
  { 
    title: 'text', 
    description: 'text',
    project: 'text',
    assignee: 'text'
  }, 
  { 
    weights: { 
      title: 10, 
      description: 5, 
      project: 3,
      assignee: 2
    },
    name: 'task_text_search'
  }
)

// Special indexes for TaskWarrior compatibility
TaskSchema.index({ status: 1, priority: 1, dueDate: 1 }) // TaskWarrior style filtering
TaskSchema.index({ depends: 1 }, { sparse: true }) // Dependency queries

export default mongoose.model<ITask>('Task', TaskSchema)
