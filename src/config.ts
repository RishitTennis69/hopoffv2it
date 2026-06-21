// Runtime configuration. Public keys are inlined at build time via the
// EXPO_PUBLIC_ prefix (see https://docs.expo.dev/guides/environment-variables/).
//
// Copy .env.example to .env and fill in values, or set them in EAS secrets.

export const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

export const config = {
  /** When true, real YouTube search is used; otherwise the seeded mock. */
  useRealYouTube: YOUTUBE_API_KEY.length > 0,
};
