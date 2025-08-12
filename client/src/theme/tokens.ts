// Design System Tokens (Phase 1 - Scaffolding)
// NOTE: These are initial tokens; values chosen to approximate existing look.
// Future refactors will replace ad-hoc values in components with these tokens.

export const color = {
  light: {
    surface0: '#ffffff',
    surface1: '#f6f8fa',
    surface2: '#eef1f5',
    surface3: '#e2e7ef',
    primary: '#2aa198',
    secondary: '#cb4b16',
    info: '#0969da',
    success: '#1a7f37',
    warning: '#bf8700',
    danger: '#cf222e',
    outline: '#d1d9e0',
    focusRing: '#2684ff',
    textPrimary: '#1f2328',
    textSecondary: '#4f5863'
  },
  dark: {
    surface0: '#1a1b25',
    surface1: '#252736',
    surface2: '#303246',
    surface3: '#3a3d52',
    primary: '#a5b4fc',
    secondary: '#f0abfc',
    info: '#93c5fd',
    success: '#86efac',
    warning: '#fcd34d',
    danger: '#f9a8d4',
    outline: '#383b54',
    focusRing: '#6366f1',
    textPrimary: '#e2e4f3',
    textSecondary: '#a9adc7'
  }
};

export const semantic = {
  priority: {
    high: { light: '#cf222e', dark: '#f87171' },
    medium: { light: '#bf8700', dark: '#facc15' },
    low: { light: '#1a7f37', dark: '#4ade80' }
  },
  status: {
    pending: { light: '#0969da', dark: '#60a5fa' },
    completed: { light: '#1a7f37', dark: '#4ade80' },
    overdue: { light: '#cf222e', dark: '#f87171' }
  }
};

export const spacing = {
  scale: (n: number) => n * 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999
};

export const elevation = {
  // Unified elevation tokens (shadows kept subtle)
  0: 'none',
  1: '0 1px 2px rgba(0,0,0,0.1)',
  2: '0 2px 4px rgba(0,0,0,0.12)',
  3: '0 4px 8px rgba(0,0,0,0.14)',
  4: '0 6px 12px rgba(0,0,0,0.16)',
  5: '0 8px 16px rgba(0,0,0,0.18)',
  6: '0 12px 24px rgba(0,0,0,0.20)'
};

export const motion = {
  duration: {
    fast: 120,
    normal: 200,
    slow: 320
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)'
  }
};

export const typography = {
  // Updated global font to Space Grotesk for all text
  fontFamily: '"Space Grotesk", Inter, Roboto, Helvetica, Arial, sans-serif',
  sizes: {
    caption: 12,
    body2: 14,
    body1: 16,
    subtitle2: 14,
    subtitle1: 16,
    h6: 20,
    h5: 24,
    h4: 32,
    h3: 40
  }
};

// Aggregated design tokens object
export const tokens = {
  color,
  semantic,
  spacing,
  radii,
  elevation,
  motion,
  typography
};

export type Tokens = typeof tokens;
