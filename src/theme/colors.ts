// HopOff color system — pure black canvas, white type, dark glass.
export const colors = {
  bg: '#000000',
  // Light surfaces (stat tiles, primary CTAs, block video shell)
  card: '#F0F0F0',
  cardText: '#000000',

  // Text on black
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.3)',
  textGhost: 'rgba(255,255,255,0.18)',

  // Dark glass
  glassFill: 'rgba(255,255,255,0.04)',
  glassFillActive: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBorderActive: 'rgba(255,255,255,0.18)',
  glassHighlight: 'rgba(255,255,255,0.22)',

  // Near-black fill (dark / secondary pill, tab bar)
  dark: '#0E0E0E',
  darkElevated: '#161616',

  // Accent — rare emphasis
  accent: '#3466AA',

  // Status
  danger: '#E2453C',
  success: '#3FB984',

  scrim: 'rgba(0,0,0,0.5)',
  scrimHeavy: 'rgba(0,0,0,0.92)',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;
