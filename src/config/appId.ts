import Constants from 'expo-constants';

/** Android application id — used as WebView baseUrl + YouTube embed origin. */
export const ANDROID_PACKAGE =
  Constants.expoConfig?.android?.package ?? 'com.gethopoff.app';

/** Origin string YouTube expects for in-app WebView embeds (Error 153 fix). */
export const YOUTUBE_EMBED_ORIGIN = `https://${ANDROID_PACKAGE}`;
