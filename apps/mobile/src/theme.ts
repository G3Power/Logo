export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
  checker: string;
}

export const palette: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: "#F7F7FB",
    surface: "#FFFFFF",
    surfaceAlt: "#EFEFF6",
    border: "#E3E3EE",
    text: "#16161E",
    textSecondary: "#5F6072",
    accent: "#5B5BEA",
    accentSoft: "#E8E8FD",
    danger: "#D7263D",
    success: "#1F9D55",
    checker: "#ECECF4",
  },
  dark: {
    background: "#0E0E14",
    surface: "#181822",
    surfaceAlt: "#222230",
    border: "#2C2C3C",
    text: "#F2F2F8",
    textSecondary: "#9C9DB0",
    accent: "#7C7CFF",
    accentSoft: "#26264A",
    danger: "#FF6B81",
    success: "#3DD68C",
    checker: "#23232F",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
} as const;

export const maxContentWidth = 860;
