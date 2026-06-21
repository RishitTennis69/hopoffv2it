export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenH: 22, // horizontal screen padding
} as const;

export const radius = {
  sm: 12,
  md: 16,
  card: 22,
  pill: 999,
} as const;

// Low-elevation soft black drop shadow used on frosted panels.
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.5,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;
