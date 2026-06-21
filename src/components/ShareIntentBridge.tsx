import { useShareIntent } from 'expo-share-intent';
import { useEffect, useRef } from 'react';

import { ingestSharedUrl } from '@/services/shareIntake';
import { useVideos } from '@/store';

/** Listens for Android/iOS share-sheet payloads and adds them to the library. */
export function ShareIntentBridge() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const addVideo = useVideos((s) => s.addVideo);
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

    void ingestSharedUrl(url, shareIntent.meta?.title ?? null)
      .then(addVideo)
      .finally(() => resetShareIntent());
  }, [hasShareIntent, shareIntent, addVideo, resetShareIntent]);

  return null;
}
