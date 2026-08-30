// Editorial luxury theme — derived from design_guidelines.json.
// "Old craft. New language." — warm ivory + ink black, sharp radii, magazine spacing.

export const colors = {
  surface: "#FBFBF9",
  onSurface: "#1C1C1A",
  surfaceSecondary: "#F2F1EC",
  onSurfaceSecondary: "#3A3A36",
  surfaceTertiary: "#E8E6E0",
  onSurfaceTertiary: "#5C5C56",
  surfaceInverse: "#1C1C1A",
  onSurfaceInverse: "#FBFBF9",
  brand: "#1C1C1A",
  brandSecondary: "#8C857B",
  brandTertiary: "#D9D4CD",
  success: "#4A5D4E",
  warning: "#C28F5B",
  error: "#8B4545",
  border: "#E8E6E0",
  borderStrong: "#1C1C1A",
  divider: "#E8E6E0",
} as const;

export const fonts = {
  display: "Cormorant",
  displayMedium: "Cormorant-Medium",
  displaySemiBold: "Cormorant-SemiBold",
  sans: "Satoshi",
  sansMedium: "Satoshi-Medium",
  sansBold: "Satoshi-Bold",
  sansLight: "Satoshi-Light",
  sansBlack: "Satoshi-Black",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 0,
  md: 4,
  lg: 8,
  pill: 999,
} as const;

export const INR_TO_USD = 0.012;
