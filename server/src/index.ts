import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { taskRoutes } from './routes/tasks'
import { importRoutes } from './routes/import'
import { projectRoutes } from './routes/projects'
import { mindmapRoutes } from './routes/mindmaps'
import connectDB from './database/mongodb'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 3001

// Initialize MongoDB connection
connectDB()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || 'https://yourdomain.com').split(',') 
    : (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'synaptik-api',
    message: '🧠 Where Ideas Connect'
  })
})

// API Routes
app.use('/api/tasks', taskRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/mindmaps', mindmapRoutes)
app.use('/api/import', importRoutes)

// 404 handler
app.use('*', notFoundHandler)

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  }
})
