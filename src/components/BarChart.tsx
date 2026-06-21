import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';
import { Txt } from './Txt';

export interface BarDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarDatum[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  height?: number;
}

function Bar({
  datum,
  ratio,
  selected,
  onPress,
  maxHeight,
}: {
  datum: BarDatum;
  ratio: number;
  selected: boolean;
  onPress: () => void;
  maxHeight: number;
}) {
  const scale = useSharedValue(1);
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withTiming(1, { duration: 520 });
  }, [grow]);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 6, stiffness: 220 }),
        withSpring(1, { damping: 12 }),
      );
    }
  }, [selected, scale]);

  const barStyle = useAnimatedStyle(() => ({
    height: Math.max(6, maxHeight * ratio) * grow.value,
    transform: [{ scaleY: scale.value }],
    backgroundColor: selected ? colors.white : 'rgba(255,255,255,0.18)',
  }));

  return (
    <Pressable
      style={styles.col}
      onPress={() => {
        haptics.selection();
        onPress();
      }}>
      <View style={[styles.barTrack, { height: maxHeight }]}>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>
      <Txt variant="caption" color={selected ? colors.text : colors.textFaint}>
        {datum.label}
      </Txt>
    </Pressable>
  );
}

// Weekday bars; tap a day to select. Selected bar bounces and brightens.
export function BarChart({ data, selectedIndex, onSelect, height = 150 }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.row}>
      {data.map((d, i) => (
        <Bar
          key={d.label + i}
          datum={d}
          ratio={d.value / max}
          selected={i === selectedIndex}
          onPress={() => onSelect(i)}
          maxHeight={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 10,
  },
});
