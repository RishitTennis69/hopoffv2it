// Runtime configuration. Expo inlines EXPO_PUBLIC_* values into the app bundle,
// so this file must only read non-secret browser/mobile-safe values.
//
// Third-party API keys belong in a server-side proxy or vault-backed runtime.
// The app only knows the proxy base URL.

export const HOPOFF_API_BASE_URL = process.env.EXPO_PUBLIC_HOPOFF_API_BASE_URL ?? '';

export const config = {
  /** When true, server-proxied YouTube search is used; otherwise the seeded mock. */
  useRealYouTube: HOPOFF_API_BASE_URL.length > 0,

  /** When true, goal polish uses the backend AI proxy; otherwise heuristic mock. */
  useOpenRouterPolish: HOPOFF_API_BASE_URL.length > 0,

  /** When true, Progress insights use the backend AI proxy. */
  useOpenRouterInsights: HOPOFF_API_BASE_URL.length > 0,

  /** During dev/testing, advance onboarding even if OS permission not detected yet. */
  permissiveOnboarding: __DEV__,
};

if (__DEV__) {
  console.log(`[HopOff] API proxy configured: ${HOPOFF_API_BASE_URL.length > 0}`);
}
