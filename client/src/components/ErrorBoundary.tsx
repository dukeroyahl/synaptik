import React, { Component, ErrorInfo, ReactNode } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Collapse,
  useTheme
} from '@mui/material'
import { 
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon
} from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // For now, just log to console in development (replace with actual service)
    if (import.meta.env.DEV) {
      console.error('Error Report:', errorReport)
    }
    
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorReport })
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    })
  }

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  private reloadPage = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          onRetry={this.handleRetry}
          onToggleDetails={this.toggleDetails}
          onReload={this.reloadPage}
        />
      )
    }

    return this.props.children
  }
}

interface FallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  onRetry: () => void
  onToggleDetails: () => void
  onReload: () => void
}

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({
  error,
  errorInfo,
  showDetails,
  onRetry,
  onToggleDetails,
  onReload
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundColor: theme.palette.background.default
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <ErrorIcon 
            sx={{ 
              fontSize: 64, 
              color: theme.palette.error.main,
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" gutterBottom color="error">
            Oops! Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We're sorry, but something unexpected happened. The error has been logged 
            and our team has been notified.
          </Typography>

          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>
              Error: {error?.message || 'Unknown error'}
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              color="primary"
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              onClick={onReload}
              color="secondary"
            >
              Reload Page
            </Button>
          </Box>

          <Box sx={{ textAlign: 'left' }}>
            <Button
              variant="text"
              size="small"
              startIcon={<BugIcon />}
              endIcon={<ExpandMoreIcon 
                sx={{ 
                  transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }} 
              />}
              onClick={onToggleDetails}
              color="inherit"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>

            <Collapse in={showDetails}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Stack:
                </Typography>
                <Box 
                  sx={{ 
                    backgroundColor: theme.palette.grey[100],
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {error?.stack || 'No stack trace available'}
                </Box>

                {errorInfo?.componentStack && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Component Stack:
                    </Typography>
                    <Box 
                      sx={{ 
                        backgroundColor: theme.palette.grey[100],
                        p: 2,
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {errorInfo.componentStack}
                    </Box>
                  </>
                )}
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ErrorBoundary