import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  _id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'completed' | 'on-hold'
  priority: 'low' | 'medium' | 'high'
  startDate: Date
  endDate?: Date
  progress: number
  mindmapId?: string
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema: Schema = new Schema({
  name: {
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
    enum: ['planning', 'active', 'completed', 'on-hold'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  mindmapId: {
    type: Schema.Types.ObjectId,
    ref: 'Mindmap'
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

// Optimized compound indexes for common query patterns
ProjectSchema.index({ status: 1, priority: 1, startDate: -1 }) // Filter by status and priority, sort by start date
ProjectSchema.index({ status: 1, progress: -1 }) // Active projects by progress
ProjectSchema.index({ endDate: 1, status: 1 }) // Projects by deadline and status
ProjectSchema.index({ startDate: 1 }) // Projects by start date
ProjectSchema.index({ createdAt: -1 }) // Recent projects
ProjectSchema.index({ updatedAt: -1 }) // Recently modified projects

// Sparse indexes for optional fields
ProjectSchema.index({ endDate: 1 }, { sparse: true }) // Only index projects with end dates
ProjectSchema.index({ mindmapId: 1 }, { sparse: true }) // Only index projects with mindmaps

// Text search index with weights
ProjectSchema.index(
  { 
    name: 'text', 
    description: 'text' 
  }, 
  { 
    weights: { 
      name: 10, 
      description: 5 
    },
    name: 'project_text_search'
  }
)

// Unique constraint on project name
ProjectSchema.index({ name: 1 }, { unique: true })

export default mongoose.model<IProject>('Project', ProjectSchema)
