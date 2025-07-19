import React, { useState } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  Alert,
  Collapse,
  Grid,
  useTheme
} from '@mui/material'
import {
  Send as SendIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material'

interface TaskCaptureProps {
  onTaskCaptured?: (task: any) => void
}

const TaskCapture: React.FC<TaskCaptureProps> = ({ onTaskCaptured }) => {
  const theme = useTheme();
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/tasks/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: input.trim()
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Task captured successfully!' })
        setInput('')
        if (onTaskCaptured) {
          onTaskCaptured(result)
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to capture task' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'Buy groceries due:tomorrow +shopping',
    'Fix login bug priority:H project:webapp assignee:John',
    'Call mom scheduled:friday +family',
    'Review code priority:M +review project:synaptik assignee:Sarah',
    'Write documentation due:3d +docs'
  ]

  return (
    <Paper 
      elevation={theme.palette.mode === 'dark' ? 2 : 1} 
      sx={{ p: 2.5 }}
      className="custom-card"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
          Quick Task Capture
        </Typography>
        <IconButton
          size="small"
          onClick={() => setShowHelp(!showHelp)}
          sx={{ ml: 1 }}
        >
          <HelpIcon />
        </IconButton>
      </Box>

      <Collapse in={showHelp}>
        <Alert 
          severity="info" 
          sx={{ mb: 1.5, py: 1 }}
          action={
            <IconButton size="small" onClick={() => setShowHelp(false)}>
              <CloseIcon />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.875rem' }}>
            TaskWarrior-style syntax:
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontSize: '0.8rem' }}>
            • <strong>priority:</strong> H (High), M (Medium), L (Low)<br/>
            • <strong>project:</strong> Project name<br/>
            • <strong>assignee:</strong> Person name<br/>
            • <strong>due:</strong> today, tomorrow, friday, 3d, 2w, 2024-12-25<br/>
            • <strong>scheduled:</strong> Same as due<br/>
            • <strong>+tag:</strong> Add tags with + prefix<br/>
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Examples:
            </Typography>
            {examples.map((example, index) => (
              <Chip
                key={index}
                label={example}
                size="small"
                variant="outlined"
                sx={{ 
                  m: 0.25, 
                  fontSize: '0.7rem',
                  height: '20px',
                  cursor: 'pointer' 
                }}
                onClick={() => setInput(example)}
              />
            ))}
          </Box>
        </Alert>
      </Collapse>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 1.5, py: 0.5 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              placeholder="Buy groceries due:tomorrow +shopping priority:M"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              variant="outlined"
              size="small"
              helperText="Type your task with attributes"
              sx={{
                '& .MuiFormHelperText-root': {
                  fontSize: '0.75rem',
                  mt: 0.5
                }
              }}
            />
          </Grid>
          <Grid item>
            <IconButton
              type="submit"
              disabled={!input.trim() || loading}
              color="primary"
              size="medium"
            >
              <SendIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  )
}

export default TaskCapture
