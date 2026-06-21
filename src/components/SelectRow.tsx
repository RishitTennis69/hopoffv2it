import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading element (AppIcon or line Icon). */
  left?: React.ReactNode;
  /** Secondary line under the label. */
  subtitle?: string;
  /** Trailing check style: 'circle' (filled circle) or 'check' (plain check). */
  checkStyle?: 'circle' | 'check';
}

export function SelectRow({ label, selected, onPress, left, subtitle, checkStyle = 'check' }: Props) {
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}>
      <GlassCard active={selected} highlight style={styles.row}>
        <View style={styles.left}>
          {left}
          <View style={styles.labelWrap}>
            <Txt variant="bodyStrong" color={selected ? colors.text : colors.text}>
              {label}
            </Txt>
            {subtitle ? (
              <Txt variant="caption" color={colors.textMuted}>
                {subtitle}
              </Txt>
            ) : null}
          </View>
        </View>

        {checkStyle === 'circle' ? (
          <View style={[styles.circle, selected && styles.circleOn]}>
            {selected && <Icon name="check" size={14} color={colors.cardText} />}
          </View>
        ) : selected ? (
          <Icon name="check" size={20} color={colors.text} />
        ) : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 64,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  labelWrap: {
    flex: 1,
    gap: 2,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
});
