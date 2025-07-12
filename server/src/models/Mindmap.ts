import mongoose, { Schema, Document } from 'mongoose'

export interface IMindmap extends Document {
  _id: string
  title: string
  description?: string
  nodes: Array<{
    id: string
    label: string
    x: number
    y: number
    type: 'root' | 'topic' | 'subtopic' | 'note'
    color?: string
    size?: number
    data?: any
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type?: 'default' | 'arrow' | 'smooth'
    label?: string
    color?: string
  }>
  projectId?: string
  isPublic: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const MindmapSchema: Schema = new Schema({
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
  nodes: [{
    id: { type: String, required: true },
    label: { type: String, required: true, maxlength: 100 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    type: { 
      type: String, 
      enum: ['root', 'topic', 'subtopic', 'note'], 
      default: 'topic' 
    },
    color: { type: String, match: /^#[0-9A-F]{6}$/i },
    size: { type: Number, min: 10, max: 100, default: 20 },
    data: { type: Schema.Types.Mixed }
  }],
  edges: [{
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['default', 'arrow', 'smooth'], 
      default: 'default' 
    },
    label: { type: String, maxlength: 50 },
    color: { type: String, match: /^#[0-9A-F]{6}$/i }
  }],
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
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
MindmapSchema.index({ isPublic: 1, createdAt: -1 }) // Public mindmaps by recency
MindmapSchema.index({ projectId: 1, isPublic: 1 }) // Project mindmaps with visibility filter
MindmapSchema.index({ tags: 1, isPublic: 1 }) // Tag-based queries with visibility
MindmapSchema.index({ createdAt: -1 }) // Recent mindmaps
MindmapSchema.index({ updatedAt: -1 }) // Recently modified mindmaps

// Sparse indexes for optional fields
MindmapSchema.index({ projectId: 1 }, { sparse: true }) // Only index mindmaps with projects
MindmapSchema.index({ tags: 1 }, { sparse: true }) // Only index mindmaps with tags

// Text search index with weights
MindmapSchema.index(
  { 
    title: 'text', 
    description: 'text' 
  }, 
  { 
    weights: { 
      title: 10, 
      description: 5 
    },
    name: 'mindmap_text_search'
  }
)

// Performance optimization: exclude large fields from default queries
MindmapSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // Don't include nodes and edges in list views by default
    if (options && options.minimize) {
      delete ret.nodes
      delete ret.edges
    }
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  }
})

// Validation for nodes and edges
MindmapSchema.pre('save', function(this: IMindmap, next) {
  // Ensure unique node IDs
  const nodeIds = this.nodes.map(node => node.id)
  const uniqueNodeIds = new Set(nodeIds)
  if (nodeIds.length !== uniqueNodeIds.size) {
    const error = new Error('Node IDs must be unique')
    return next(error)
  }

  // Ensure unique edge IDs
  const edgeIds = this.edges.map(edge => edge.id)
  const uniqueEdgeIds = new Set(edgeIds)
  if (edgeIds.length !== uniqueEdgeIds.size) {
    const error = new Error('Edge IDs must be unique')
    return next(error)
  }

  // Validate edge references
  for (const edge of this.edges) {
    if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) {
      const error = new Error('Edge source and target must reference existing nodes')
      return next(error)
    }
  }

  next()
})

// Method to add node
MindmapSchema.methods.addNode = function(node: any) {
  // Ensure unique ID
  if (this.nodes.some((n: any) => n.id === node.id)) {
    throw new Error('Node with this ID already exists')
  }
  
  this.nodes.push(node)
  return this.save()
}

// Method to update node
MindmapSchema.methods.updateNode = function(nodeId: string, updates: any) {
  const nodeIndex = this.nodes.findIndex((n: any) => n.id === nodeId)
  if (nodeIndex === -1) {
    throw new Error('Node not found')
  }
  
  // Update node properties
  Object.assign(this.nodes[nodeIndex], updates)
  return this.save()
}

// Method to remove node
MindmapSchema.methods.removeNode = function(nodeId: string) {
  // Remove node
  this.nodes = this.nodes.filter((n: any) => n.id !== nodeId)
  
  // Remove associated edges
  this.edges = this.edges.filter((e: any) => 
    e.source !== nodeId && e.target !== nodeId
  )
  
  return this.save()
}

// Method to add edge
MindmapSchema.methods.addEdge = function(edge: any) {
  // Ensure unique ID
  if (this.edges.some((e: any) => e.id === edge.id)) {
    throw new Error('Edge with this ID already exists')
  }
  
  // Validate source and target exist
  const nodeIds = this.nodes.map((n: any) => n.id)
  if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) {
    throw new Error('Edge source and target must reference existing nodes')
  }
  
  this.edges.push(edge)
  return this.save()
}

// Method to remove edge
MindmapSchema.methods.removeEdge = function(edgeId: string) {
  this.edges = this.edges.filter((e: any) => e.id !== edgeId)
  return this.save()
}

export default mongoose.model<IMindmap>('Mindmap', MindmapSchema)