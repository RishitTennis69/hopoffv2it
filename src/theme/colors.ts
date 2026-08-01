// HopOff color system: white canvas, light gray cards, black primary actions.
export const colors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7',
  card: '#FFFFFF',
  cardText: '#0A0A0A',

  text: '#0A0A0A',
  textMuted: '#565656',
  textFaint: '#9A9A9A',
  textGhost: '#D8D8D8',

  glassFill: '#FFFFFF',
  glassFillActive: '#FFFFFF',
  glassBorder: 'rgba(10,10,10,0.09)',
  glassBorderActive: 'rgba(10,10,10,0.22)',
  glassHighlight: 'rgba(247,247,247,0)',
  pressFill: 'rgba(10,10,10,0.055)',

  dark: '#0A0A0A',
  darkElevated: '#161616',
  accent: '#0A0A0A',

  danger: '#E2453C',
  success: '#3FB984',

  scrim: 'rgba(0,0,0,0.5)',
  scrimHeavy: 'rgba(0,0,0,0.92)',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;
