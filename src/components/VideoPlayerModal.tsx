import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import type { VideoClip } from '@/store/types';
import { Icon } from './Icon';
import { Txt } from './Txt';
import { VideoFrame } from './VideoFrame';

interface Props {
  clip: VideoClip | null;
  onClose: () => void;
}

export function VideoPlayerModal({ clip, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!clip} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={[styles.close, { top: insets.top + 12 }]}>
          <Icon name="close" size={26} color={colors.white} />
        </Pressable>

        {clip ? (
          <View style={styles.center}>
            <View style={styles.player}>
              <VideoFrame clip={clip} playing muted={false} borderRadius={radius.card} />
            </View>
            <View style={styles.meta}>
              <Txt variant="subheading" center numberOfLines={2}>
                {clip.title}
              </Txt>
              <Txt variant="body" color={colors.textMuted} center>
                {clip.author}
              </Txt>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  close: {
    position: 'absolute',
    right: 18,
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  player: {
    width: '78%',
    aspectRatio: 9 / 16,
    maxHeight: '70%',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  meta: {
    gap: 4,
    alignItems: 'center',
  },
});
