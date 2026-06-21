import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Bottom sheet (default) or centered dialog. */
  variant?: 'sheet' | 'center';
}

// Dimmed backdrop + bottom sheet or centered panel. Tapping the backdrop closes.
export function PopupPanel({ visible, onClose, children, variant = 'sheet' }: Props) {
  const insets = useSafeAreaInsets();
  const centered = variant === 'center';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.flex}>
        <View style={[styles.root, centered && styles.rootCenter]}>
          <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
            <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
          </Animated.View>

          <Animated.View
            entering={centered ? FadeInDown.duration(220) : SlideInDown.duration(260)}
            exiting={centered ? undefined : SlideOutDown}
            style={[
              centered ? styles.dialog : styles.sheet,
              !centered && { paddingBottom: insets.bottom + spacing.xl },
            ]}>
            {!centered ? <View style={styles.grabber} /> : null}
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rootCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.darkElevated,
    borderTopLeftRadius: radius.card + 6,
    borderTopRightRadius: radius.card + 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.darkElevated,
    borderRadius: radius.card + 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.glassBorderActive,
    marginBottom: spacing.lg,
  },
});
