import { createTheme, Theme } from '@mui/material/styles';
import { tokens } from './tokens';

// Factory to build a theme using our design tokens
export const buildTheme = (mode: 'light' | 'dark'): Theme => {
  const paletteSource = tokens.color[mode];
  const isDark = mode === 'dark';

  const t = createTheme({
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
      // Apply Space Grotesk globally (already in tokens.typography.fontFamily)
      fontFamily: tokens.typography.fontFamily,
      fontSize: 14,
      h6: { fontSize: tokens.typography.sizes.h6, fontWeight: 600, letterSpacing: '-0.5px' },
      h5: { fontSize: tokens.typography.sizes.h5, fontWeight: 600, letterSpacing: '-0.5px' },
      h4: { fontSize: tokens.typography.sizes.h4, fontWeight: 600, letterSpacing: '-0.75px' },
      h3: { fontSize: tokens.typography.sizes.h3, fontWeight: 600, letterSpacing: '-1px' }
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

  // Augment with semantic helpers
  (t as any).semanticStyles = {
    priority: {
      HIGH: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.priority.high.dark}33 0%, ${tokens.semantic.priority.high.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.priority.high.light}22 0%, ${tokens.semantic.priority.high.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.priority.high.dark : tokens.semantic.priority.high.light}40`,
        color: isDark ? tokens.semantic.priority.high.dark : tokens.semantic.priority.high.light
      },
      MEDIUM: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.priority.medium.dark}33 0%, ${tokens.semantic.priority.medium.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.priority.medium.light}22 0%, ${tokens.semantic.priority.medium.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.priority.medium.dark : tokens.semantic.priority.medium.light}40`,
        color: isDark ? tokens.semantic.priority.medium.dark : tokens.semantic.priority.medium.light
      },
      LOW: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.priority.low.dark}33 0%, ${tokens.semantic.priority.low.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.priority.low.light}22 0%, ${tokens.semantic.priority.low.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.priority.low.dark : tokens.semantic.priority.low.light}40`,
        color: isDark ? tokens.semantic.priority.low.dark : tokens.semantic.priority.low.light
      }
    },
    status: {
      COMPLETED: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.status.completed.dark}33 0%, ${tokens.semantic.status.completed.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.status.completed.light}22 0%, ${tokens.semantic.status.completed.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.status.completed.dark : tokens.semantic.status.completed.light}40`,
        color: isDark ? tokens.semantic.status.completed.dark : tokens.semantic.status.completed.light
      },
      ACTIVE: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.status.pending.dark}33 0%, ${tokens.semantic.status.pending.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.status.pending.light}22 0%, ${tokens.semantic.status.pending.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.status.pending.dark : tokens.semantic.status.pending.light}40`,
        color: isDark ? tokens.semantic.status.pending.dark : tokens.semantic.status.pending.light
      },
      PENDING: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.status.pending.dark}33 0%, ${tokens.semantic.status.pending.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.status.pending.light}22 0%, ${tokens.semantic.status.pending.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.status.pending.dark : tokens.semantic.status.pending.light}40`,
        color: isDark ? tokens.semantic.status.pending.dark : tokens.semantic.status.pending.light
      },
      OVERDUE: {
        gradient: isDark ? `linear-gradient(135deg, ${tokens.semantic.status.overdue.dark}33 0%, ${tokens.semantic.status.overdue.dark}1A 100%)` : `linear-gradient(135deg, ${tokens.semantic.status.overdue.light}22 0%, ${tokens.semantic.status.overdue.light}0F 100%)`,
        border: `${isDark ? tokens.semantic.status.overdue.dark : tokens.semantic.status.overdue.light}40`,
        color: isDark ? tokens.semantic.status.overdue.dark : tokens.semantic.status.overdue.light
      }
    }
  };

  // Glass surface tokens (centralized for reuse)
  (t as any).glass = {
    blurPrimary: 22,
    blurDense: 18,
    blurReduced: 8,
    saturation: 1.35,
    brightness: 1.08,
    innerHairlineLight: 0.18,
    specularTopOpacity: isDark ? 0.45 : 0.55,
    noiseOpacity: isDark ? 0.025 : 0.02,
  // Tiny 8x8 semi-random monochrome noise PNG (generated) for better natural texture than pure CSS pattern
  noiseDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAK0lEQVQoU2NkYGD4z0AEYBxVSFIMRBiAVSBiGJgGTAKxKpgsR6JpGApGo4QAALwBBL2G2CvQAAAAABJRU5ErkJggg==',
    shadowLight: '0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -6px rgba(0,0,0,0.08)',
    shadowLightHover: '0 2px 4px rgba(0,0,0,0.16), 0 10px 32px -6px rgba(0,0,0,0.10)',
    shadowDark: '0 1px 2px rgba(0,0,0,0.6), 0 8px 24px -6px rgba(0,0,0,0.4)',
    shadowDarkHover: '0 2px 4px rgba(0,0,0,0.65), 0 10px 30px -6px rgba(0,0,0,0.5)'
  };

  return t;
};
