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
import { taskService } from '../services/taskService'

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
      const task = await taskService.captureTask(input.trim())
      setMessage({ type: 'success', text: 'Task captured successfully!' })
      setInput('')
      if (onTaskCaptured) {
        onTaskCaptured(task)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture task'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'Buy groceries due:tomorrow +shopping',
    'Fix login bug priority:H project:webapp assignee:John',
    'Meet with Sarah tomorrow at 3pm about the project',
    'Call mom scheduled:friday +family',
    'Review code priority:M +review project:synaptik assignee:Sarah',
    'Write documentation due:3d +docs',
    'Send urgent email to client about the proposal',
    'Schedule team meeting for next Monday at 2pm',
    'Meet Roy a week from now to discuss about project',
    'Catch up with Tom next week over dinner'
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
            Natural Language or TaskWarrior-style syntax:
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontSize: '0.8rem' }}>
            <strong>Natural Language:</strong><br/>
            • "Meet with Sarah tomorrow at 3pm about the project"<br/>
            • "Call client urgent regarding proposal"<br/>
            • "Review code next Friday for the webapp"<br/>
            • "Meet Roy a week from now to discuss project"<br/>
            • "Schedule meeting next week"<br/>
            <br/>
            <strong>TaskWarrior Syntax:</strong><br/>
            • <strong>priority:</strong> H (High), M (Medium), L (Low)<br/>
            • <strong>project:</strong> Project name<br/>
            • <strong>assignee:</strong> Person name<br/>
            • <strong>due:</strong> today, tomorrow, friday, next week, a week from now, 3d, 2w, 2024-12-25<br/>
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
              placeholder="Meet Tom tomorrow at 3pm about the project"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              variant="outlined"
              size="small"
              helperText="Type naturally or use TaskWarrior syntax"
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
