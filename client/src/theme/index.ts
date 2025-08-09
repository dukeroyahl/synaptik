import { createTheme, Theme } from '@mui/material/styles';
import { tokens } from './tokens';

// Factory to build a theme using our design tokens
export const buildTheme = (mode: 'light' | 'dark'): Theme => {
  const paletteSource = tokens.color[mode];
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      background: {
        default: paletteSource.surface0,
        paper: paletteSource.surface1
      },
      primary: { main: paletteSource.primary },
      secondary: { main: paletteSource.secondary },
      info: { main: paletteSource.info },
      success: { main: paletteSource.success },
      warning: { main: paletteSource.warning },
      error: { main: paletteSource.danger },
      divider: paletteSource.outline,
      text: {
        primary: paletteSource.textPrimary,
        secondary: paletteSource.textSecondary
      }
    },
    typography: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: 14,
      h6: { fontSize: tokens.typography.sizes.h6 },
      h5: { fontSize: tokens.typography.sizes.h5 },
      h4: { fontSize: tokens.typography.sizes.h4 },
      h3: { fontSize: tokens.typography.sizes.h3 }
    },
    shape: {
      borderRadius: tokens.radii.md
    },
    shadows: [
      'none',
      tokens.elevation[1],
      tokens.elevation[2],
      tokens.elevation[3],
      tokens.elevation[4],
      tokens.elevation[5],
      tokens.elevation[6],
      ...Array(18).fill(tokens.elevation[6])
    ] as any,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: tokens.radii.sm,
            transition: `background-color ${tokens.motion.duration.normal}ms ${tokens.motion.easing.standard}`
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radii.lg,
            boxShadow: tokens.elevation[isDark ? 2 : 1],
            transition: `box-shadow ${tokens.motion.duration.normal}ms ${tokens.motion.easing.standard}`,
            '&:hover': {
              boxShadow: tokens.elevation[isDark ? 4 : 3]
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radii.md,
            '&:focus-visible': {
              outline: `2px solid ${paletteSource.focusRing}`,
              outlineOffset: 2
            }
          }
        }
      }
    },
    ds: tokens
  });
};
