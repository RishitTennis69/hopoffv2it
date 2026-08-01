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
  card: 24,
  xl: 32,
  pill: 18,
} as const;

// Soft lift used on white and light-gray panels.
export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.07,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
} as const;
