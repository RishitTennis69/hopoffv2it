import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';
import { PillButton } from './PillButton';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Centered confirmation dialog (e.g. "use the default order").
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View entering={FadeIn} style={styles.scrim}>
        <Animated.View entering={ZoomIn.springify().damping(18)} style={styles.card}>
          <Txt variant="subheading" center>
            {title}
          </Txt>
          <Txt variant="body" color={colors.textMuted} center>
            {message}
          </Txt>
          <View style={styles.actions}>
            <PillButton label={confirmLabel} onPress={onConfirm} style={{ alignSelf: 'stretch' }} />
            <PillButton label={cancelLabel} variant="ghost" onPress={onCancel} style={{ alignSelf: 'stretch' }} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.darkElevated,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
