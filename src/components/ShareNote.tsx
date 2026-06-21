import { FontAwesome6 } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  onShare: (platform: 'tiktok' | 'instagram') => void;
}

// "See it on TikTok or Instagram?" — taps simulate the share-sheet intake.
export function ShareNote({ onShare }: Props) {
  return (
    <View style={styles.card}>
      <Txt variant="bodyStrong">See it on TikTok or Instagram?</Txt>

      <View style={styles.flow}>
        <Pressable
          style={styles.brandBtn}
          onPress={() => {
            haptics.medium();
            onShare('tiktok');
          }}>
          <FontAwesome6 name="tiktok" iconStyle="brand" size={18} color={colors.white} />
        </Pressable>
        <Pressable
          style={styles.brandBtn}
          onPress={() => {
            haptics.medium();
            onShare('instagram');
          }}>
          <FontAwesome6 name="instagram" iconStyle="brand" size={18} color={colors.white} />
        </Pressable>
        <Icon name="arrowRight" size={16} color={colors.textMuted} />
        <View style={[styles.brandBtn, styles.hop]}>
          <Txt style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: colors.bg }}>H</Txt>
        </View>
      </View>

      <Txt variant="caption" color={colors.textMuted}>
        Share · Pick HopOff · Saved
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hop: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
});
