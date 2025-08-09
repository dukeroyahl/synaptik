import { useState, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, ThemeProvider, CssBaseline, CircularProgress, Typography } from '@mui/material'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorAlert from './components/ErrorAlert'
import { getInitialTheme } from './utils/themeUtils'
import useErrorHandler from './hooks/useErrorHandler'
import { buildTheme } from './theme'

// Lazy load page components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CalendarView = lazy(() => import('./pages/CalendarView'))
const EisenhowerMatrix = lazy(() => import('./pages/EisenhowerMatrix'))
const Projects = lazy(() => import('./pages/Projects'))

// Loading fallback component
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

function App() {
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const { errors, removeError, clearErrors } = useErrorHandler();

  // Build theme via design system tokens (Phase 1 scaffolding)
  const theme = buildTheme(darkMode ? 'dark' : 'light');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      if (import.meta.env.DEV) {
        console.error('App Error Boundary:', error, errorInfo)
      }
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <ErrorBoundary fallback={<div>Navigation error occurred</div>}>
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </ErrorBoundary>
          <Box component="main" sx={{ flex: 1, p: 3 }}>
            <ErrorBoundary fallback={<div>Page loading error occurred</div>}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/matrix" element={<EisenhowerMatrix />} />
                  <Route path="/projects" element={<Projects />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Box>
          <ErrorAlert
            errors={errors}
            onRemoveError={removeError}
            onClearAll={clearErrors}
            maxVisible={3}
          />
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App
