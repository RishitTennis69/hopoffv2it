import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, type } from '@/theme';
import { Txt } from './Txt';

const SIZE = 76;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

interface Props {
  percent: number;
}

/** Circular commit-rate gauge — no caption; sits in the stat strip. */
export function CommitRateRing({ percent }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = C * (1 - clamped / 100);
  const ringColor = clamped >= 50 ? colors.success : clamped > 0 ? colors.white : colors.glassBorder;

  return (
    <View style={styles.wrap}>
      <View style={styles.ringBox}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.glassBorder}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={ringColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.center}>
          <Txt style={styles.pct}>{clamped}</Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  ringBox: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    ...type.stat,
    fontSize: 20,
    lineHeight: 22,
    color: colors.text,
  },
});
