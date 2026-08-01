import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme';
import { AppIcon } from './AppIcon';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  onShare: (platform: 'tiktok' | 'instagram') => void;
}

export function ShareNote({ onShare }: Props) {
  return (
    <View style={styles.card}>
      <Txt variant="bodyStrong" center>
        Found a video on TikTok or Instagram?
      </Txt>

      <View style={styles.flow}>
        <Pressable
          onPress={() => {
            haptics.medium();
            onShare('tiktok');
          }}>
          <AppIcon brand="tiktok" size={44} />
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.medium();
            onShare('instagram');
          }}>
          <AppIcon brand="instagram" size={44} />
        </Pressable>
        <Icon name="arrowRight" size={16} color={colors.textMuted} />
        <View style={[styles.hop, styles.hopBadge]}>
          <Txt style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: colors.white }}>H</Txt>
        </View>
      </View>

      <Txt variant="caption" color={colors.textMuted} center>
        Press Share, pick HopOff,
        {'\n'}
        and it lands in this library.
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
    alignItems: 'center',
  },
  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  hop: {
    backgroundColor: colors.black,
  },
  hopBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
