import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppIcon,
  BarChart,
  GlassCard,
  Icon,
  PillButton,
  ScreenTitle,
  StatCard,
  TrialPaywallModal,
  Txt,
} from '@/components';
import type { BarDatum } from '@/components';
import { getApp } from '@/data/apps';
import { enoughTimeTo } from '@/services/insights';
import { triggerBlock } from '@/services/blockMonitor';
import { getInstalledApps } from '@/services/nativeUsage';
import { formatHoursUnit } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { resetAllStores, useApps, useGoals, useSubscription, useUsage } from '@/store';

export default function Progress() {
  const insets = useSafeAreaInsets();
  const week = useUsage((s) => s.week);
  const selectedDayIndex = useUsage((s) => s.selectedDayIndex);
  const selectDay = useUsage((s) => s.selectDay);
  const syncUsage = useUsage((s) => s.syncFromDevice);
  const totalWastedHours = useUsage((s) => s.totalWastedHours);
  const avgScreenTimeMinutes = useUsage((s) => s.avgScreenTimeMinutes);
  const commitRate = useUsage((s) => s.commitRate);
  const weekHours = useUsage((s) => s.weekHours);
  const softSpots = useUsage((s) => s.softSpots);

  const selectedIds = useApps((s) => s.selectedIds);
  const goalLines = useGoals((s) => s.goalLines);
  const trialExpired = useSubscription((s) => s.trialExpired);

  const [refreshing, setRefreshing] = useState(false);
  const [showTrial, setShowTrial] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (trialExpired()) setShowTrial(true);
    }, [trialExpired]),
  );

  useEffect(() => {
    if (week.length === 0) syncUsage(selectedIds).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getInstalledApps();
    await syncUsage(selectedIds);
    setRefreshing(false);
  }, [selectedIds, syncUsage]);

  const barData: BarDatum[] = week.map((d) => ({
    label: d.label,
    value: Object.values(d.byApp).reduce((a, b) => a + b, 0),
  }));

  const spots = softSpots(selectedDayIndex);
  const topSpot = spots[0];
  const topApp = topSpot ? getApp(topSpot.appId) : undefined;
  const bullets = enoughTimeTo(weekHours(), goalLines());

  const logOut = () => {
    resetAllStores();
    router.replace('/onboarding/welcome');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}>
      <ScreenTitle title="What you could have been doing" center />

      <View style={styles.statRow}>
        <StatCard label="Time wasted" value={`${totalWastedHours()}`} unit="Hrs" />
        <StatCard label="Screen time" value={`${avgScreenTimeMinutes()}`} unit="Min/day" />
        <StatCard label="Commit rate" value={`${commitRate()}`} unit="%" />
      </View>

      {weekHours() > 0 ? (
        <View style={styles.section}>
          <Txt variant="subheading">That&apos;s enough time to…</Txt>
          <View style={{ gap: spacing.sm }}>
            {bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Txt variant="body" color={colors.textMuted} style={{ flex: 1 }}>
                  {b}
                </Txt>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Txt variant="caption" color={colors.textMuted}>
          YOUR WEEK
        </Txt>
        <BarChart data={barData} selectedIndex={selectedDayIndex} onSelect={selectDay} />
      </View>

      <View style={styles.section}>
        <Txt variant="caption" color={colors.textMuted}>
          YOUR SOFT SPOTS
        </Txt>
        {spots.length === 0 ? (
          <Txt variant="body" color={colors.textMuted}>
            Tap a day above to see where your time went.
          </Txt>
        ) : (
          spots.map((s) => {
            const app = getApp(s.appId);
            if (!app) return null;
            return (
              <GlassCard key={s.appId} style={styles.spotRow}>
                <View style={styles.spotLeft}>
                  <AppIcon brand={app.brand} size={34} />
                  <Txt variant="bodyStrong">{app.name}</Txt>
                </View>
                <Txt variant="bodyStrong" color={colors.textMuted}>
                  {formatHoursUnit(s.minutes / 60)}
                </Txt>
              </GlassCard>
            );
          })
        )}
      </View>

      {topApp && topSpot && topSpot.minutes >= 60 ? (
        <View style={styles.section}>
          <Txt variant="body" color={colors.textMuted}>
            You&apos;ve been spending a lot of time on {topApp.name}.
          </Txt>
          <PillButton
            label="Change my limits"
            variant="dark"
            onPress={() => router.push('/(tabs)/apps')}
          />
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <Pressable style={styles.footerBtn} onPress={() => router.push('/settings')}>
          <Icon name="settings" size={18} color={colors.textMuted} />
          <Txt variant="body" color={colors.textMuted}>
            Settings
          </Txt>
        </Pressable>
        <Pressable style={styles.footerBtn} onPress={logOut}>
          <Icon name="logout" size={18} color={colors.textMuted} />
          <Txt variant="body" color={colors.textMuted}>
            Log out (dev)
          </Txt>
        </Pressable>
      </View>

      <Pressable onPress={() => triggerBlock(topApp?.id ?? 'tiktok')} hitSlop={8}>
        <Txt variant="caption" color={colors.textFaint} center>
          Preview block screen (dev)
        </Txt>
      </Pressable>

      <TrialPaywallModal visible={showTrial} onClose={() => setShowTrial(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    gap: spacing.xxl,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.glassBorder,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
