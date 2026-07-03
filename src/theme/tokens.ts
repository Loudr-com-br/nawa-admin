/**
 * Tokens do Design System NAWA em TypeScript.
 * Espelham as CSS variables em src/app/globals.css e o DS em ds/design.md.
 * Fonte da verdade para o tema MUI (theme.ts) e para consumo direto em componentes.
 */

export const colors = {
  brand: {
    primary: "#204FF1",
    dark: "#0619AD",
    whiteNawa: "#D5D5D5",
    white: "#FFFFFF",
  },
  blue: {
    50: "#EEF2FE",
    100: "#D6DFFE",
    200: "#ADBFFE",
    500: "#204FF1",
    700: "#0619AD",
    900: "#030A52",
  },
  neutral: {
    0: "#FFFFFF",
    50: "#F8F8F8",
    100: "#F0F0F0",
    200: "#E0E0E0",
    400: "#A0A0A0",
    600: "#606060",
    900: "#111111",
  },
  success: { main: "#22C55E", light: "#DCFCE7" },
  warning: { main: "#F59E0B", light: "#FEF9C3" },
  error: { main: "#EF4444", light: "#FEE2E2" },
  info: { main: "#3B82F6", light: "#DBEAFE" },
  surface: {
    page: "#F8F8F8",
    card: "#FFFFFF",
    brand: "#204FF1",
  },
  text: {
    primary: "#111111",
    secondary: "#606060",
    disabled: "#A0A0A0",
    onBrand: "#FFFFFF",
    brand: "#204FF1",
  },
  border: {
    subtle: "#EDEEF0",
    default: "#E0E0E0",
    focus: "#204FF1",
    error: "#EF4444",
  },
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
  lg: "0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
  xl: "0 24px 56px rgba(0,0,0,0.16), 0 8px 20px rgba(0,0,0,0.10)",
} as const;

export const motion = {
  duration: { fast: 150, normal: 250, slow: 400, slower: 600 },
  ease: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
  },
} as const;

/** MUI usa spacing base 8px; a escala do DS vai de 4 a 96. */
export const spacingBase = 8;
