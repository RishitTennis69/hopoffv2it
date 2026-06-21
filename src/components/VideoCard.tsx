import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';
import type { VideoClip } from '@/store/types';
import { Icon } from './Icon';
import { Txt } from './Txt';
import { VideoFrame } from './VideoFrame';

interface Props {
  clip: VideoClip;
  corner: 'add' | 'trash' | 'added';
  selected?: boolean;
  flash?: boolean;
  onPress?: () => void;
  onCorner?: () => void;
}

function durationLabel(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoCard({ clip, corner, selected, flash, onPress, onCorner }: Props) {
  const glow = useSharedValue(0);

  useEffect(() => {
    if (flash) {
      glow.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 700 }));
    }
  }, [flash, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: selected ? colors.white : `rgba(255,255,255,${0.1 + glow.value * 0.5})`,
  }));

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Animated.View style={[styles.thumbWrap, glowStyle, selected && styles.selectedBorder]}>
        <VideoFrame clip={clip} borderRadius={radius.md} />

        {clip.pending ? (
          <View style={styles.pending}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <View style={styles.duration}>
            <Txt variant="caption" color={colors.white}>
              {durationLabel(clip.durationSec)}
            </Txt>
          </View>
        )}
      </Animated.View>

      <View style={styles.meta}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
            {clip.title}
          </Txt>
          <Txt variant="caption" color={colors.textMuted} numberOfLines={1}>
            {clip.author}
          </Txt>
        </View>

        <Pressable
          onPress={onCorner}
          hitSlop={8}
          style={[styles.cornerBtn, corner === 'added' && styles.cornerAdded]}>
          {corner === 'trash' ? (
            <Icon name="trash" size={16} color={colors.textMuted} />
          ) : corner === 'added' ? (
            <Icon name="check" size={16} color={colors.text} />
          ) : (
            <Icon name="plus" size={18} color={colors.text} />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.sm,
  },
  thumbWrap: {
    aspectRatio: 9 / 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  selectedBorder: {
    borderWidth: 2,
  },
  duration: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pending: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cornerBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerAdded: {
    backgroundColor: colors.glassFillActive,
    borderColor: colors.glassBorderActive,
  },
});
