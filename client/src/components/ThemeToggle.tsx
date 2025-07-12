import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { setTheme } from '../utils/themeUtils';

interface ThemeToggleProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, toggleDarkMode }) => {
  const handleToggle = () => {
    toggleDarkMode();
    setTheme(!darkMode);
  };

  return (
    <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Solarized Dark"}>
      <IconButton onClick={handleToggle} color="inherit">
        {darkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
