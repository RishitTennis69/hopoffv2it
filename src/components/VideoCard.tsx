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
  /** Tap thumbnail (outside play badge) to toggle selection in search. */
  onSelect?: () => void;
  /** Tap center play badge to preview. */
  onPlay?: () => void;
  onCorner?: () => void;
}

function durationLabel(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoCard({ clip, corner, selected, flash, onSelect, onPlay, onCorner }: Props) {
  const glow = useSharedValue(0);

  useEffect(() => {
    if (flash) {
      glow.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 700 }));
    }
  }, [flash, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: selected ? colors.black : `rgba(10,10,10,${0.1 + glow.value * 0.28})`,
  }));

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.thumbWrap, glowStyle, selected && styles.selectedBorder]}>
        <VideoFrame clip={clip} borderRadius={radius.md} />

        {onSelect ? (
          <Pressable
            style={styles.selectHit}
            onPress={onSelect}
            accessibilityRole="button"
            accessibilityLabel={selected ? 'Deselect video' : 'Select video'}
          />
        ) : null}

        {clip.pending ? (
          <View style={styles.pending} pointerEvents="none">
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <View style={styles.duration} pointerEvents="none">
            <Txt variant="caption" color={colors.white}>
              {durationLabel(clip.durationSec)}
            </Txt>
          </View>
        )}

        {onPlay ? (
          <Pressable
            onPress={onPlay}
            hitSlop={8}
            style={styles.playHit}
            accessibilityRole="button"
            accessibilityLabel={`Preview ${clip.title}`}>
            <View style={styles.playBadge}>
              <Icon name="play" size={20} color={colors.white} />
            </View>
          </Pressable>
        ) : null}
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
          hitSlop={10}
          style={styles.cornerBtn}
          accessibilityRole="button"
          accessibilityLabel={
            corner === 'trash'
              ? `Remove ${clip.title}`
              : corner === 'added'
                ? `Remove ${clip.title} from selection`
                : `Add ${clip.title}`
          }>
          {corner === 'trash' ? (
            <Icon name="trash" size={16} color={colors.textMuted} />
          ) : corner === 'added' ? (
            <Icon name="minus" size={16} color={colors.textMuted} />
          ) : (
            <Icon name="plus" size={18} color={colors.text} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: spacing.sm,
  },
  thumbWrap: {
    aspectRatio: 9 / 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.dark,
  },
  selectedBorder: {
    borderWidth: 2,
  },
  selectHit: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  playHit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  duration: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 3,
  },
  pending: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 62,
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
});
