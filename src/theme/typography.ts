// Plus Jakarta Sans handles the full hierarchy; weight creates the contrast.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  displayBold: 'PlusJakartaSans_700Bold',
  displayBlack: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  hero: {
    fontFamily: fonts.displayBlack,
    fontSize: 45,
    lineHeight: 50,
    letterSpacing: 0,
  },
  title: {
    fontFamily: fonts.displayBlack,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  subheading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 27,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  stat: {
    fontFamily: fonts.displayBlack,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 0,
  },
} as const;
