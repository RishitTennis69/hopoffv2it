import { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '@/theme';
import type { VideoClip } from '@/store/types';
import { VideoFrame } from './VideoFrame';

interface Props {
  clip: VideoClip;
  playing?: boolean;
  /** Fires when the clip finishes playing (not a timer estimate). */
  onVideoFinished?: () => void;
}

export function BlockVideoFrame({ clip, playing = true, onVideoFinished }: Props) {
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
  }, [clip.id]);

  const finishOnce = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onVideoFinished?.();
  }, [onVideoFinished]);

  return (
    <View style={styles.shell}>
      <View style={styles.inner}>
        <VideoFrame
          clip={clip}
          playing={playing}
          muted={Platform.OS === 'web'}
          noControls
          borderRadius={radius.md - 1}
          onEnded={finishOnce}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'center',
    width: '96%',
    maxWidth: 380,
    aspectRatio: 9 / 16,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    padding: 4,
    backgroundColor: colors.white,
    ...shadow,
  },
  inner: {
    // No overflow:'hidden' here — VideoFrame already clips the player. A second
    // hardware-layer clip around the WebView video surface can leave it black
    // (audio only) on some Android devices.
    flex: 1,
    borderRadius: radius.card,
    backgroundColor: '#000',
  },
});
