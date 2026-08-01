import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard, Icon, PillButton, ScreenTitle, Txt } from '@/components';
import type { IconName } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { resetAllStores, useSubscription } from '@/store';
import type { PlanId } from '@/store/types';

const PLANS: { id: PlanId; title: string; price: string; note?: string }[] = [
  { id: 'monthly', title: 'Monthly', price: '$4.99/month' },
  { id: 'annual', title: 'Annual', price: '$29.99/year', note: 'Best value' },
];

const PRIVACY_POLICY_URL = 'https://gethopoff.app/privacy';
const DATA_DELETION_URL = 'https://gethopoff.app/delete-data';

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
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
        {onPress ? <Icon name="chevronRight" size={18} color={colors.textFaint} /> : null}
      </GlassCard>
    </Pressable>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const subscribed = useSubscription((s) => s.subscribed);
  const plan = useSubscription((s) => s.plan);
  const daysLeft = useSubscription((s) => s.daysLeft);
  const setPlan = useSubscription((s) => s.setPlan);
  const restore = useSubscription((s) => s.restore);
  const trialStartedAt = useSubscription((s) => s.trialStartedAt);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(plan ?? 'annual');
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const onTrial = !subscribed && (trialStartedAt !== undefined || daysLeft() > 0);

  const statusTitle = subscribed
    ? `${plan === 'annual' ? 'Annual' : 'Monthly'} plan`
    : onTrial
      ? `${daysLeft()} day${daysLeft() === 1 ? '' : 's'} left on free trial`
      : 'Free plan';

  const statusSubtitle = subscribed
    ? 'Renews automatically until cancelled.'
    : onTrial
      ? 'Upgrade anytime to keep your momentum after the trial.'
      : 'You are currently using HopOff for free. Upgrade when you want ongoing blocking and tracking.';

  const resetData = () => {
    resetAllStores();
    router.replace('/onboarding/welcome');
  };

  const confirmResetData = () => {
    Alert.alert(
      'Reset local data?',
      'This clears HopOff goals, selected apps, usage snapshots, videos, and subscription test state stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetData },
      ],
    );
  };

  const restorePurchases = () => {
    restore();
    setRestoreMessage('Purchases restored');
    setTimeout(() => setRestoreMessage(null), 1800);
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

        <GlassCard style={styles.trialCard}>
          <View style={styles.trialHead}>
            <Txt variant="caption" color={colors.textMuted}>
              TRIAL STATUS
            </Txt>
            <Txt variant="title" style={styles.statusTitle}>
              {statusTitle}
            </Txt>
            <Txt variant="caption" color={colors.textMuted}>
              {statusSubtitle}
            </Txt>
          </View>

          {!subscribed ? (
            <View style={{ gap: spacing.sm }}>
              {PLANS.map((p) => {
                const active = selectedPlan === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedPlan(p.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${p.title} plan, ${p.price}`}>
                    <GlassCard active={active} highlight style={styles.planRow}>
                      <View style={styles.planLeft}>
                        <View style={[styles.radio, active && styles.radioOn]}>
                          {active ? <Icon name="check" size={12} color={colors.white} /> : null}
                        </View>
                        <View>
                          <Txt variant="bodyStrong">{p.title}</Txt>
                          <Txt variant="caption" color={colors.textMuted}>
                            {p.price}
                          </Txt>
                        </View>
                      </View>
                      {p.note ? (
                        <View style={styles.badge}>
                          <Txt variant="caption" color={colors.white}>
                            {p.note}
                          </Txt>
                        </View>
                      ) : null}
                    </GlassCard>
                  </Pressable>
                );
              })}
              <PillButton
                label="Subscribe"
                onPress={() => setPlan(selectedPlan)}
                style={styles.subscribeBtn}
              />
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <Pressable
              onPress={restorePurchases}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases">
              <Txt variant="body" color={colors.textMuted}>
                Restore purchases
              </Txt>
            </Pressable>
            {restoreMessage ? (
              <Txt variant="caption" color={colors.success}>
                {restoreMessage}
              </Txt>
            ) : null}
          </View>
        </GlassCard>

        <Row icon="shield" label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
        <Row icon="trash" label="Delete local data" onPress={confirmResetData} danger />
        <Row icon="share" label="Data deletion help" onPress={() => Linking.openURL(DATA_DELETION_URL)} />

        <Txt variant="caption" color={colors.textFaint}>
          HopOff does not create in-app user accounts. Plans renew automatically until cancelled.
          Manage or cancel anytime in your app store account settings.
        </Txt>
      </View>
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
  trialCard: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  trialHead: {
    gap: spacing.xs,
  },
  statusTitle: {
    fontWeight: '700',
  },
  subscribeBtn: {
    alignSelf: 'center',
    width: '72%',
    minHeight: 48,
    paddingVertical: 10,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  badge: {
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  cardFooter: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    gap: spacing.xs,
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
});
