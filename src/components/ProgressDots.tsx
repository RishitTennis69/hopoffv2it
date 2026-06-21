import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme';

interface Props {
  total: number;
  /** 0-based index of the current step. */
  current: number;
  /** Called when a completed (earlier) dot is tapped. */
  onJump?: (index: number) => void;
}

function Dot({
  active,
  completed,
  onPress,
}: {
  active: boolean;
  completed: boolean;
  onPress?: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 6, { duration: 240 }),
    backgroundColor: withTiming(
      active ? colors.white : completed ? colors.textMuted : colors.textGhost,
      { duration: 240 },
    ),
  }));

  return (
    <Pressable onPress={onPress} disabled={!completed} hitSlop={8}>
      <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />
    </Pressable>
  );
}

// 8-step progress strip; current = elongated white pill, completed dots tappable.
export function ProgressDots({ total, current, onJump }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot
          key={i}
          active={i === current}
          completed={i < current}
          onPress={i < current ? () => onJump?.(i) : undefined}
        />
      ))}
    </View>
  );
}
