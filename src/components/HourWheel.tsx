import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';
import { Txt } from './Txt';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  step: number;
  size?: number;
  centerBig: string;
  centerSmall: string;
}

const TAU = Math.PI * 2;

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/** Build an SVG arc path from the top (12 o'clock) clockwise by `sweepFrac`. */
function arcPath(cx: number, cy: number, r: number, sweepFrac: number) {
  if (sweepFrac <= 0) return '';
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + TAU * Math.min(sweepFrac, 0.9999);
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = sweepFrac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function spokeCountFor(max: number, step: number) {
  if (step >= 1) return Math.max(1, Math.round(max / step));
  return Math.max(1, Math.floor(max));
}

export function HourWheel({
  value,
  onChange,
  min,
  max,
  step,
  size = 260,
  centerBig,
  centerSmall,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size / 2 - 22;
  const lowerBound = min ?? step;

  const pan = useMemo(() => {
    const setFromAngle = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      // angle from top (12 o'clock), clockwise, 0..1
      let frac = (Math.atan2(dy, dx) + Math.PI / 2) / TAU;
      if (frac < 0) frac += 1;
      const raw = frac * max;
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.min(max, Math.max(lowerBound, stepped));
      const rounded = Math.round(clamped / step) * step;
      if (rounded !== value) {
        if (rounded > value) haptics.medium();
        else haptics.selection();
        onChange(rounded);
      }
    };
    return Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .onBegin((e) => setFromAngle(e.x, e.y))
      .onUpdate((e) => setFromAngle(e.x, e.y));
  }, [cx, cy, max, step, lowerBound, value, onChange]);

  const sweep = value / max;
  const handleAngle = -Math.PI / 2 + TAU * sweep;
  const handle = polar(cx, cy, ringR, handleAngle);

  const spokes = useMemo(() => {
    const count = spokeCountFor(max, step);
    return Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * TAU - Math.PI / 2;
      const inner = polar(cx, cy, ringR - 14, a);
      const outer = polar(cx, cy, ringR - 4, a);
      return { inner, outer, key: i };
    });
  }, [cx, cy, ringR, max, step]);

  return (
    <View style={{ width: size, height: size }} collapsable={false}>
      <Svg width={size} height={size} pointerEvents="none">
        {spokes.map((s) => (
          <Line
            key={s.key}
            x1={s.inner.x}
            y1={s.inner.y}
            x2={s.outer.x}
            y2={s.outer.y}
            stroke={colors.textGhost}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        <Circle cx={cx} cy={cy} r={ringR} stroke={colors.glassBorder} strokeWidth={3} fill="none" />
        <Path d={arcPath(cx, cy, ringR, sweep)} stroke={colors.white} strokeWidth={3} fill="none" strokeLinecap="round" />
        <G>
          <Circle cx={handle.x} cy={handle.y} r={11} fill={colors.white} />
          <Circle cx={handle.x} cy={handle.y} r={4} fill={colors.black} />
        </G>
      </Svg>

      <GestureDetector gesture={pan}>
        <View style={[StyleSheet.absoluteFill, styles.touchLayer]} />
      </GestureDetector>

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Txt variant="stat" style={{ fontSize: 48, lineHeight: 52 }}>
          {centerBig}
        </Txt>
        <Txt variant="body" color={colors.textMuted}>
          {centerSmall}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchLayer: {
    zIndex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
