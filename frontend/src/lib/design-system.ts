/**
 * Green Wheels–inspired design tokens.
 * Primary green brand, neutral gray text/surfaces, red destructive, amber warning.
 */
export const colors = {
  primary: "#006B3C",
  primaryHover: "#005A32",
  primaryLight: "#00804A",
  primarySoft: "#ECFDF5",
  destructive: "#B91C1C",
  warning: "#F59E0B",
  text: {
    primary: "#111827",
    secondary: "#374151",
    muted: "#6B7280",
  },
  bg: {
    page: "#F3F4F6",
    surface: "#F3F4F6",
    card: "#FFFFFF",
    inset: "#F9FAFB",
  },
  border: {
    default: "#E5E7EB",
    light: "#F3F4F6",
  },
} as const;

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.primary} 100%)`,
} as const;
