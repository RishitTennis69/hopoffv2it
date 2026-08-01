import { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '@/theme';
import { useGoals } from '@/store';
import { GlassCard } from './GlassCard';
import { Txt } from './Txt';

const INPUT_ACCESSORY_ID = 'goals-editor-done';

interface Props {
  minHeight?: number;
  placeholder?: string;
  onBlurPolish?: () => void;
  polishing?: boolean;
}

export function GoalsEditor({
  minHeight = 160,
  placeholder,
  onBlurPolish,
  polishing,
}: Props) {
  const text = useGoals((s) => s.text);
  const setText = useGoals((s) => s.setText);
  const [overlayHeight, setOverlayHeight] = useState(0);

  const veil = useSharedValue(0);
  const shimmerY = useSharedValue(0);
  const polishingActive = useSharedValue(0);

  useEffect(() => {
    if (polishing) {
      polishingActive.value = 1;
      veil.value = withRepeat(
        withSequence(withTiming(0.62, { duration: 500 }), withTiming(0.48, { duration: 500 })),
        -1,
        true,
      );
      if (overlayHeight > 0) {
        const travel = Math.max(overlayHeight - 2, 0);
        shimmerY.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(travel, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
      }
      return;
    }

    veil.value = withTiming(0, { duration: 480 });
    shimmerY.value = withTiming(0, { duration: 480 });
    polishingActive.value = 0;
  }, [polishing, overlayHeight, polishingActive, shimmerY, veil]);

  const veilStyle = useAnimatedStyle(() => ({
    opacity: polishingActive.value ? veil.value : 0,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shimmerY.value }],
    opacity: polishingActive.value ? 0.9 : 0,
  }));

  const dismissAndPolish = () => {
    Keyboard.dismiss();
    onBlurPolish?.();
  };

  return (
    <Pressable style={{ gap: spacing.lg }} onPress={Keyboard.dismiss} accessible={false}>
      <GlassCard style={styles.editor}>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={() => onBlurPolish?.()}
          returnKeyType="default"
          blurOnSubmit={false}
          multiline
          placeholder={placeholder ?? 'Write your goals, one per line…'}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { minHeight }]}
          textAlignVertical="top"
          editable={!polishing}
          inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
        />

        {polishing ? (
          <View
            style={styles.overlay}
            pointerEvents="auto"
            onLayout={(e) => setOverlayHeight(e.nativeEvent.layout.height)}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.veil, veilStyle]} />
            <Animated.View style={[styles.shimmerBar, shimmerStyle]} />
            <View style={styles.overlayLabel}>
              <Txt variant="bodyStrong" color={colors.white} center>
                Polishing…
              </Txt>
            </View>
          </View>
        ) : null}
      </GlassCard>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={dismissAndPolish} hitSlop={8}>
              <Txt variant="bodyStrong" color={colors.accent}>
                Done
              </Txt>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}

    </Pressable>
  );
}

const styles = StyleSheet.create({
  editor: {
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  input: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  veil: {
    backgroundColor: '#000',
  },
  shimmerBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.white,
  },
  overlayLabel: {
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  accessory: {
    backgroundColor: colors.darkElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
});
