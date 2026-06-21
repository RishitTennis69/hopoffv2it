import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, Icon, ScreenTitle, Txt, TrialPaywallModal } from '@/components';
import type { IconName } from '@/components';
import { colors, spacing } from '@/theme';
import { resetAllStores, useSubscription } from '@/store';

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <GlassCard style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon name={icon} size={18} color={danger ? colors.danger : colors.text} />
          <Txt variant="bodyStrong" color={danger ? colors.danger : colors.text}>
            {label}
          </Txt>
        </View>
        <View style={styles.rowRight}>
          {value ? (
            <Txt variant="body" color={colors.textMuted}>
              {value}
            </Txt>
          ) : null}
          {onPress ? <Icon name="chevronRight" size={18} color={colors.textFaint} /> : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const subscribed = useSubscription((s) => s.subscribed);
  const plan = useSubscription((s) => s.plan);
  const daysLeft = useSubscription((s) => s.daysLeft);
  const [showPlans, setShowPlans] = useState(false);

  const trialStatus = subscribed
    ? `${plan === 'annual' ? 'Annual' : 'Monthly'} plan`
    : `Free trial — ${daysLeft()} days left`;

  const logOut = () => {
    resetAllStores();
    router.replace('/onboarding/welcome');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Icon name="back" size={26} color={colors.text} />
        </Pressable>
        <Txt variant="subheading">Settings</Txt>
      </View>

      <View style={styles.body}>
        <ScreenTitle title="Your subscription" />
        <View style={{ gap: spacing.md }}>
          <Row icon="bell" label="Trial status" value={trialStatus} />
          <Row icon="lock" label="View plans" onPress={() => setShowPlans(true)} />
          <Row icon="refresh" label="Restore purchases" onPress={() => setShowPlans(true)} />
          <Row icon="insight" label="Subscription terms" onPress={() => {}} />
          <Row icon="logout" label="Log out" onPress={logOut} danger />
        </View>

        <Txt variant="caption" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
          Plans renew automatically until cancelled. Manage or cancel anytime in your app store
          account settings.
        </Txt>
      </View>

      <TrialPaywallModal visible={showPlans} onClose={() => setShowPlans(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  back: {
    position: 'absolute',
    left: spacing.screenH,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenH,
    gap: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 58,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
