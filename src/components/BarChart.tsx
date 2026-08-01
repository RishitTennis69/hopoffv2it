import { Pressable, StyleSheet, View } from 'react-native';

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
  const barHeight = Math.max(6, maxHeight * ratio);
  const roundedValue = Math.round(datum.value);

  return (
    <Pressable
      style={styles.col}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${datum.label}, ${roundedValue} minute${roundedValue === 1 ? '' : 's'}${selected ? ', selected' : ''}`}
      onPress={() => {
        haptics.selection();
        onPress();
      }}>
      <View style={[styles.barTrack, { height: maxHeight }]}>
        <View
          style={[
            styles.bar,
            {
              height: barHeight,
              backgroundColor: selected ? colors.black : colors.textGhost,
            },
          ]}
        />
      </View>
      <Txt variant="caption" color={selected ? colors.text : colors.textFaint}>
        {datum.label}
      </Txt>
    </Pressable>
  );
}

/** Weekday bars — tap a day to select. Selected bar brightens only (no bounce). */
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
