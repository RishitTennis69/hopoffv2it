import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';
import type { VideoClip } from '@/store/types';
import { VideoFrame } from './VideoFrame';

interface Props {
  clip: VideoClip;
  /** Fires once the user has watched enough to unlock the commit CTA. */
  onWatchedEnough?: () => void;
}

// Light shell on the black block screen, holding the 9:16 motivation clip.
export function BlockVideoFrame({ clip, onWatchedEnough }: Props) {
  useEffect(() => {
    // No reliable progress event for the webview embed — gate on a watch
    // threshold scaled to clip length (min 5s, max 10s).
    const threshold = Math.min(10000, Math.max(5000, clip.durationSec * 1000 * 0.4));
    const t = setTimeout(() => onWatchedEnough?.(), threshold);
    return () => clearTimeout(t);
  }, [clip.durationSec, onWatchedEnough]);

  return (
    <View style={styles.shell}>
      <View style={styles.inner}>
        <VideoFrame clip={clip} playing muted={false} borderRadius={radius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 10,
    alignSelf: 'center',
    width: '74%',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  inner: {
    aspectRatio: 9 / 16,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
