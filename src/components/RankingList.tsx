/* eslint-disable react-hooks/immutability -- Reanimated gesture callbacks are
   worklets; mutating shared values (`.value =`) inside them is the intended
   pattern, but the React Compiler lint can't model the worklet context here. */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { GlassCard } from './GlassCard';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

const ROW_HEIGHT = 68;
const GAP = 12;
const STEP = ROW_HEIGHT + GAP;
const MOVE = { duration: 220, easing: Easing.out(Easing.cubic) };

type Positions = Record<string, number>;

function clamp(value: number, lower: number, upper: number) {
  'worklet';
  return Math.max(lower, Math.min(value, upper));
}

// Recompute the position map after moving an item between two slots.
function objectMove(positions: Positions, from: number, to: number): Positions {
  'worklet';
  const next: Positions = {};
  for (const id of Object.keys(positions)) {
    const p = positions[id];
    if (p === from) next[id] = to;
    else if (from < to && p > from && p <= to) next[id] = p - 1;
    else if (from > to && p < from && p >= to) next[id] = p + 1;
    else next[id] = p;
  }
  return next;
}

interface Props {
  items: string[];
  onChange: (next: string[]) => void;
  iconFor: (label: string) => IconName;
}

// Long-press to lift a row, then drag to reorder. Other rows animate out of
// the way and rank numbers update live. #1 is brightest; lower ranks fade.
export function RankingList({ items, onChange, iconFor }: Props) {
  const positions = useSharedValue<Positions>(
    items.reduce<Positions>((acc, label, i) => {
      acc[label] = i;
      return acc;
    }, {}),
  );

  // Reset positions if the items set is replaced (e.g. "use defaults").
  const key = useRef(items.join('|'));
  useEffect(() => {
    const next = items.join('|');
    if (next !== key.current) {
      key.current = next;
      positions.value = items.reduce<Positions>((acc, label, i) => {
        acc[label] = i;
        return acc;
      }, {});
    }
  }, [items, positions]);

  const commit = (p: Positions) => {
    const ordered = Object.keys(p).sort((a, b) => p[a] - p[b]);
    onChange(ordered);
  };

  return (
    <View style={{ height: items.length * STEP - GAP }}>
      {items.map((label) => (
        <Row
          key={label}
          id={label}
          label={label}
          icon={iconFor(label)}
          count={items.length}
          positions={positions}
          onCommit={commit}
        />
      ))}
    </View>
  );
}

interface RowProps {
  id: string;
  label: string;
  icon: IconName;
  count: number;
  positions: ReturnType<typeof useSharedValue<Positions>>;
  onCommit: (p: Positions) => void;
}

function Row({ id, label, icon, count, positions, onCommit }: RowProps) {
  const top = useSharedValue(positions.value[id] * STEP);
  const active = useSharedValue(false);
  const start = useSharedValue(0);
  const [rank, setRank] = useState(positions.value[id] + 1);

  useAnimatedReaction(
    () => positions.value[id],
    (cur, prev) => {
      if (cur === undefined) return;
      if (cur !== prev) runOnJS(setRank)(cur + 1);
      if (!active.value) top.value = withTiming(cur * STEP, MOVE);
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(450)
    .onStart(() => {
      active.value = true;
      start.value = positions.value[id] * STEP;
      runOnJS(haptics.medium)();
    })
    .onUpdate((e) => {
      top.value = start.value + e.translationY;
      const newIndex = clamp(Math.round(top.value / STEP), 0, count - 1);
      const oldIndex = positions.value[id];
      if (newIndex !== oldIndex) {
        positions.value = objectMove(positions.value, oldIndex, newIndex);
        runOnJS(haptics.selection)();
      }
    })
    .onEnd(() => {
      top.value = withTiming(positions.value[id] * STEP, MOVE);
    })
    .onFinalize(() => {
      active.value = false;
      runOnJS(haptics.success)();
      runOnJS(onCommit)(positions.value);
    });

  const style = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: active.value ? 10 : 0,
    opacity: active.value ? 1 : 1,
  }));

  const rankColor =
    rank === 1 ? colors.text : `rgba(255,255,255,${Math.max(0.55, 1 - (rank - 1) * 0.18)})`;

  return (
    <Animated.View style={[styles.rowWrap, style]}>
      <GestureDetector gesture={pan}>
        <GlassCard active={false} style={styles.row}>
          <View style={styles.rankBadge}>
            <Txt variant="bodyStrong" color={rankColor}>
              {rank}
            </Txt>
          </View>
          <Icon name={icon} size={18} color={rankColor} />
          <Txt variant="bodyStrong" color={rankColor} style={{ flex: 1 }}>
            {label}
          </Txt>
          <Icon name="reorder" size={18} color={colors.textFaint} />
        </GlassCard>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.glassBorderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
