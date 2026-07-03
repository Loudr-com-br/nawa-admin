"use client";

import { createTheme } from "@mui/material/styles";
import { colors, radius, shadows } from "./tokens";

/**
 * Tema MUI da NAWA, derivado dos tokens do Design System.
 * Light-first (visão primária). Dark será adicionado por acessibilidade depois.
 */
const fontFamily =
  '"AT Aero", var(--font-poppins), "Poppins", -apple-system, sans-serif';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: colors.brand.primary,
      dark: colors.brand.dark,
      light: colors.blue[200],
      contrastText: colors.brand.white,
    },
    secondary: {
      main: colors.blue[700],
      contrastText: colors.brand.white,
    },
    success: { main: colors.success.main, light: colors.success.light },
    warning: { main: colors.warning.main, light: colors.warning.light },
    error: { main: colors.error.main, light: colors.error.light },
    info: { main: colors.info.main, light: colors.info.light },
    background: {
      default: colors.surface.page,
      paper: colors.surface.card,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.subtle,
    grey: {
      50: colors.neutral[50],
      100: colors.neutral[100],
      200: colors.neutral[200],
      400: colors.neutral[400],
      600: colors.neutral[600],
      900: colors.neutral[900],
    },
  },
  shape: {
    borderRadius: radius.md,
  },
  typography: {
    fontFamily,
    // Pesos contidos: bold reservado para poucos pontos. Corpo em 400/500.
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 500, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          minHeight: 40,
          paddingInline: 16,
        },
        outlined: {
          borderColor: colors.border.default,
          color: colors.text.primary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        elevation1: { boxShadow: shadows.sm },
        elevation2: { boxShadow: shadows.md },
        elevation3: { boxShadow: shadows.lg },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          border: `1px solid ${colors.border.subtle}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: radius.md },
        notchedOutline: { borderColor: colors.border.default },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.sm, fontWeight: 500 },
        outlined: { borderColor: colors.border.default },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.border.subtle },
        head: { fontWeight: 500 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
    },
  },
});

export default theme;
