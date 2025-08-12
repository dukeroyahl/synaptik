// Module augmentation for MUI theme to include custom design tokens
import '@mui/material/styles';
import { Tokens } from './tokens';

declare module '@mui/material/styles' {
  interface Theme {
    ds: Tokens;
  }
  interface ThemeOptions {
    ds?: Tokens;
  }
}

export {};
