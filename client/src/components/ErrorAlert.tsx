import React from 'react'
import {
  Alert,
  AlertTitle,
  Snackbar,
  Stack,
  IconButton,
  Button,
  Collapse,
  Typography,
  Box
} from '@mui/material'
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { AppError } from '../hooks/useErrorHandler'

interface ErrorAlertProps {
  errors: AppError[]
  onRemoveError: (id: string) => void
  onClearAll?: () => void
  maxVisible?: number
  position?: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  errors,
  onRemoveError,
  onClearAll,
  maxVisible = 3,
  position = { vertical: 'top', horizontal: 'right' }
}) => {
  const visibleErrors = errors.slice(0, maxVisible)
  const hiddenCount = Math.max(0, errors.length - maxVisible)

  if (errors.length === 0) {
    return null
  }

  return (
    <>
      {/* Individual error alerts */}
      {visibleErrors.map((error, index) => (
        <ErrorItem
          key={error.id}
          error={error}
          onRemove={() => onRemoveError(error.id)}
          style={{
            position: 'fixed',
            [position.vertical]: 16 + (index * 80),
            [position.horizontal]: 16,
            zIndex: 1400 + index,
            maxWidth: 400
          }}
        />
      ))}

      {/* Summary alert for additional errors */}
      {hiddenCount > 0 && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            [position.vertical]: 16 + (maxVisible * 80),
            [position.horizontal]: 16,
            zIndex: 1400 + maxVisible,
            maxWidth: 400
          }}
          action={
            <Box>
              {onClearAll && (
                <Button size="small" color="inherit" onClick={onClearAll}>
                  Clear All
                </Button>
              )}
              <IconButton
                size="small"
                color="inherit"
                onClick={() => errors.slice(maxVisible).forEach(error => onRemoveError(error.id))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {hiddenCount} more error{hiddenCount > 1 ? 's' : ''}
        </Alert>
      )}
    </>
  )
}

interface ErrorItemProps {
  error: AppError
  onRemove: () => void
  style?: React.CSSProperties
}

const ErrorItem: React.FC<ErrorItemProps> = ({ error, onRemove, style }) => {
  const [expanded, setExpanded] = React.useState(false)
  const [open, setOpen] = React.useState(true)

  const getSeverityColor = (severity: AppError['severity']) => {
    switch (severity) {
      case 'low':
        return 'info'
      case 'medium':
        return 'warning'
      case 'high':
        return 'error'
      case 'critical':
        return 'error'
      default:
        return 'warning'
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(onRemove, 300) // Wait for animation
  }

  const handleActionClick = (action: () => void) => {
    action()
    handleClose()
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={style}
    >
      <Alert
        severity={getSeverityColor(error.severity)}
        onClose={handleClose}
        sx={{ width: '100%' }}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {error.actions && error.actions.length > 0 && (
              <>
                {error.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="small"
                    color="inherit"
                    onClick={() => handleActionClick(action.action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </>
            )}
            {error.details && (
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setExpanded(!expanded)}
              >
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            )}
            <IconButton size="small" color="inherit" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        <AlertTitle>
          {error.type.charAt(0).toUpperCase() + error.type.slice(1)} Error
        </AlertTitle>
        
        <Typography variant="body2">
          {error.userMessage || error.message}
        </Typography>

        <Collapse in={expanded && !!error.details}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
              <strong>Technical Details:</strong>
            </Typography>
            <Typography 
              variant="caption" 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                whiteSpace: 'pre-wrap',
                fontSize: '0.7rem',
                maxHeight: 100,
                overflow: 'auto',
                backgroundColor: 'rgba(0,0,0,0.1)',
                p: 0.5,
                borderRadius: 0.5,
                mt: 0.5
              }}
            >
              {typeof error.details === 'string' 
                ? error.details 
                : JSON.stringify(error.details, null, 2)
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {error.timestamp.toLocaleString()}
            </Typography>
          </Box>
        </Collapse>
      </Alert>
    </Snackbar>
  )
}

export default ErrorAlert