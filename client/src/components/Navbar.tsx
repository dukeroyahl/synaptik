import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  GridView as MatrixIcon,
  Folder as ProjectsIcon,
  MoreVert as MoreIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  Settings as SettingsIcon,
  AccountTree as DependencyIcon,
  BubbleChart as ForceGraphIcon
} from '@mui/icons-material';
import { setTheme } from '../utils/themeUtils';
import ImportTasksDialog from './ImportTasksDialog';
import ExportTasksDialog from './ExportTasksDialog';
import pkg from '../../package.json';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleThemeToggle = () => {
    toggleDarkMode();
    setTheme(!darkMode);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleImportClick = () => {
    handleMenuClose();
    setImportDialogOpen(true);
  };

  const handleExportClick = () => {
    handleMenuClose();
    setExportDialogOpen(true);
  };

  const handleDependencyViewClick = () => {
    handleMenuClose();
    navigate('/dependencies');
  };

  const handleForceGraphClick = () => {
    navigate('/force-graph');
  };

  const handleImportComplete = () => {
    // Refresh the page or update the task list
    window.location.reload();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          top: 0,
          zIndex: theme.zIndex.appBar,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          boxShadow: theme.ds?.elevation[1] || '0 1px 2px rgba(0,0,0,0.1)',
          transition: `box-shadow ${theme.ds?.motion.duration.normal}ms ${theme.ds?.motion.easing.standard}, background-color ${theme.ds?.motion.duration.normal}ms ${theme.ds?.motion.easing.standard}`,
          '&:hover': {
            boxShadow: theme.ds?.elevation[2]
          }
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              letterSpacing: '0.5px',
              color: theme.palette.mode === 'light' ? theme.palette.text.primary : theme.palette.text.primary,
              textShadow: theme.palette.mode === 'light' ? '0 1px 2px rgba(255,255,255,0.6)' : '0 1px 2px rgba(0,0,0,0.6)'
            }}
          >
            <span role="img" aria-label="brain">🧠</span> Synaptik
            <Box component="span" sx={{
              fontSize: '0.6rem',
              fontWeight: 600,
              px: 0.75,
              py: 0.3,
              lineHeight: 1,
              borderRadius: 1, // reduced from pill to slight rounding
              background: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.15 : 0.25),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              v{(pkg as any).version}
            </Box>
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button 
              component={RouterLink} 
              to="/" 
              startIcon={<DashboardIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: isActive('/') ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Dashboard
            </Button>
            
            <Button 
              component={RouterLink} 
              to="/calendar" 
              startIcon={<CalendarIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: isActive('/calendar') ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Calendar
            </Button>
            
            <Button 
              component={RouterLink} 
              to="/matrix" 
              startIcon={<MatrixIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: isActive('/matrix') ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Matrix
            </Button>
            
            <Button 
              component={RouterLink} 
              to="/projects" 
              startIcon={<ProjectsIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: isActive('/projects') ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Projects
            </Button>
            
            <Button 
              onClick={handleDependencyViewClick}
              startIcon={<DependencyIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: location.pathname === '/dependencies' ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Dependencies
            </Button>
            
            <Button 
              onClick={handleForceGraphClick}
              startIcon={<ForceGraphIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: theme.spacing(1),
                  right: theme.spacing(1),
                  bottom: 2,
                  height: 3,
                  borderRadius: 2,
                  background: location.pathname === '/force-graph' ? theme.palette.primary.main : 'transparent',
                  transition: `background ${theme.ds?.motion.duration.fast}ms ${theme.ds?.motion.easing.standard}`
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  '&:after': { background: theme.palette.primary.main }
                }
              }}
            >
              Force Graph
            </Button>
            
            <IconButton 
              onClick={handleThemeToggle} 
              color="inherit"
              aria-label="Toggle dark mode"
              sx={{ 
                ml: 1,
                color: darkMode ? theme.palette.primary.main : theme.palette.warning.main
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="Open menu"
              sx={{ ml: 1 }}
            >
              <MoreIcon />
            </IconButton>
          </Box>

          {/* Mobile view */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="Open menu"
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleDependencyViewClick}>
          <ListItemIcon>
            <DependencyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Task Dependencies</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleImportClick}>
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import Tasks</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Tasks</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
      </Menu>

      {/* Import Dialog */}
      <ImportTasksDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={handleImportComplete}
      />
      
      {/* Export Dialog */}
      <ExportTasksDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </>
  );
};

export default Navbar;
