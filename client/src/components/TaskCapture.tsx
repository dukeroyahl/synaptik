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
  project?: string
}

const TaskCapture: React.FC<TaskCaptureProps> = ({ onTaskCaptured, project }) => {
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
      const task = await taskService.captureTask(input.trim(), project)
      setMessage({ type: 'success', text: 'Task captured successfully!' })
      setInput('')
      onTaskCaptured?.(task)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture task'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'Buy groceries for weekend',
    'Fix the login bug in webapp',
    'Meet with Sarah about the project',
    'Call mom this week',
    'Review code changes',
    'Write user documentation',
    'Send follow-up email to client',
    'Schedule team meeting',
    'Discuss project timeline',
    'Plan next sprint tasks'
  ]

  return (
    <Paper
      elevation={theme.palette.mode === 'dark' ? 2 : 1}
      sx={{ p: 1 }}
      className="custom-card"
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, lineHeight: 1.2 }}>
          Quick Task Capture
        </Typography>
        <IconButton size="small" onClick={() => setShowHelp(v => !v)} aria-label="Help" sx={{ mt: -0.25 }}>
          <HelpIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={showHelp}>
        <Alert
          severity="info"
          sx={{ mb: 1.2, py: 1 }}
          action={
            <IconButton size="small" onClick={() => setShowHelp(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            Simple task creation
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
            Describe your task. It will default to Medium priority, Pending status, and no due date. You can edit later.
          </Typography>
          <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap' }}>
            {examples.map(e => (
              <Chip
                key={e}
                label={e}
                size="small"
                variant="outlined"
                onClick={() => setInput(e)}
                sx={{ m: 0.25, fontSize: '0.6rem', height: 18, cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Alert>
      </Collapse>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 1.1, py: 0.5 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <TextField
          fullWidth
          placeholder={"Enter your task description...\n(Medium priority, no due date by default)"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          variant="outlined"
          size="small"
          multiline
          minRows={2}
          maxRows={6}
          sx={{
            '& textarea::placeholder': { whiteSpace: 'pre-line', opacity: 0.6 },
            '& textarea': { fontSize: '0.8rem', lineHeight: 1.35 }
          }}
        />
        <IconButton
          type="submit"
          disabled={!input.trim() || loading}
          color="primary"
          size="medium"
          sx={{ alignSelf: 'flex-start', mt: 0.25 }}
          aria-label="Create task"
        >
          <SendIcon />
        </IconButton>
      </form>
    </Paper>
  )
}

export default TaskCapture
