// Inter everywhere. Font family keys match @expo-google-fonts/inter exports.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

export const type = {
  // Big centered hero / screen titles
  hero: {
    fontFamily: fonts.black,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  subheading: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  // Big stat numbers
  stat: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    letterSpacing: -1,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 0.1,
  },
} as const;
