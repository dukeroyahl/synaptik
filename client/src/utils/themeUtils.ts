// Soft pastel sophisticated color palette for dark theme
export const darkPalette = {
  // Base colors
  background: '#1a1b25', // Deep navy blue
  paper: '#252736',      // Slightly lighter navy
  
  // Text colors
  textPrimary: '#e2e4f3',   // Soft lavender white
  textSecondary: '#a9adc7', // Muted lavender
  
  // Accent colors
  primary: '#a5b4fc',    // Soft periwinkle
  secondary: '#f0abfc',  // Soft pink
  error: '#f9a8d4',      // Soft rose
  warning: '#fcd34d',    // Soft amber
  info: '#93c5fd',       // Soft blue
  success: '#86efac',    // Soft mint
  
  // Additional pastel accents
  purple: '#d8b4fe',     // Soft purple
  teal: '#5eead4',       // Soft teal
  orange: '#fdba74',     // Soft orange
  cyan: '#7dd3fc',       // Soft sky blue
  
  // Border and divider
  divider: '#383b54',    // Subtle divider
  border: '#4c4f6d',     // Subtle border
};

export const setTheme = (isDarkMode: boolean): void => {
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'pastel-dark');
    localStorage.setItem('theme', 'pastel-dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
};

export const getInitialTheme = (): boolean => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return savedTheme === 'pastel-dark' || (!savedTheme && prefersDark);
};
