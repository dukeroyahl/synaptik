import { useState, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, ThemeProvider, createTheme, CssBaseline, CircularProgress, Typography } from '@mui/material'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorAlert from './components/ErrorAlert'
import { getInitialTheme, darkPalette } from './utils/themeUtils'
import useErrorHandler from './hooks/useErrorHandler'

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
  
  // Create theme with soft pastel sophisticated palette for dark mode
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      ...(darkMode && {
        background: {
          default: darkPalette.background,
          paper: darkPalette.paper,
        },
        text: {
          primary: darkPalette.textPrimary,
          secondary: darkPalette.textSecondary,
        },
        primary: {
          main: darkPalette.primary,
        },
        secondary: {
          main: darkPalette.secondary,
        },
        error: {
          main: darkPalette.error,
        },
        warning: {
          main: darkPalette.warning,
        },
        info: {
          main: darkPalette.info,
        },
        success: {
          main: darkPalette.success,
        },
        divider: darkPalette.divider,
      }),
      ...(darkMode === false && {
        primary: {
          main: '#2aa198', // Cyan for light
        },
        secondary: {
          main: '#cb4b16', // Orange for light
        },
      }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? darkPalette.paper : '#eee8d5',
            color: darkMode ? darkPalette.textPrimary : '#657b83',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? darkPalette.paper : '#eee8d5',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            ...(darkMode && {
              '&.MuiChip-colorPrimary': {
                backgroundColor: darkPalette.primary,
                color: darkPalette.background,
              },
              '&.MuiChip-colorSecondary': {
                backgroundColor: darkPalette.secondary,
                color: darkPalette.background,
              },
              '&.MuiChip-colorError': {
                backgroundColor: darkPalette.error,
                color: darkPalette.background,
              },
              '&.MuiChip-colorWarning': {
                backgroundColor: darkPalette.warning,
                color: darkPalette.background,
              },
              '&.MuiChip-colorInfo': {
                backgroundColor: darkPalette.info,
                color: darkPalette.background,
              },
              '&.MuiChip-colorSuccess': {
                backgroundColor: darkPalette.success,
                color: darkPalette.background,
              },
            }),
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      if (import.meta.env.DEV) {
        console.error('App Error Boundary:', error, errorInfo)
      }
      // Here you could send to error tracking service
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
          
          {/* Global error alerts */}
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
