import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  CloudDownload as ImportIcon,
  CloudUpload as ExportIcon,
  Settings as SettingsIcon,
  AccountTree as DependencyIcon
} from '@mui/icons-material';
import { setTheme } from '../utils/themeUtils';
import ImportTasksDialog from './ImportTasksDialog';
import UnifiedDependencyView from './UnifiedDependencyView';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dependencyViewOpen, setDependencyViewOpen] = useState(false);
  
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

  const handleDependencyViewClick = () => {
    handleMenuClose();
    setDependencyViewOpen(true);
  };

  const handleImportComplete = () => {
    // Refresh the page or update the task list
    window.location.reload();
  };

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
              gap: 1
            }}
          >
            <span role="img" aria-label="brain">🧠</span> Synaptik
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button 
              component={RouterLink} 
              to="/" 
              startIcon={<DashboardIcon />}
              sx={{ 
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
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
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
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
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
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
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Projects
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
          <ListItemText>Import from TaskWarrior</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
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

      {/* Unified Dependency View Dialog */}
      <UnifiedDependencyView
        open={dependencyViewOpen}
        onClose={() => setDependencyViewOpen(false)}
      />
    </>
  );
};

export default Navbar;
