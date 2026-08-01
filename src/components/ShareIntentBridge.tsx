import { useEffect, useRef } from 'react';

import { useShareIntent } from 'expo-share-intent';

/** Share-sheet video importing is paused until TikTok/Instagram metadata is reliable. */
export function ShareIntentBridge() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (error) console.warn('[share-intent]', error);
  }, [error]);

  useEffect(() => {
    if (!hasShareIntent || !shareIntent) return;

    const url =
      shareIntent.webUrl ??
      (shareIntent.text?.startsWith('http') ? shareIntent.text : undefined);
    if (!url || handled.current === url) return;
    handled.current = url;
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  return null;
}
