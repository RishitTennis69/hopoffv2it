import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppIcon,
  BarChart,
  GlassCard,
  GoalsEditor,
  Icon,
  PillButton,
  PopupPanel,
  ScreenTitle,
  TrialPaywallModal,
  Txt,
} from '@/components';
import type { BarDatum } from '@/components';
import { getApp } from '@/data/apps';
import { formatHoursUnit } from '@/lib/format';
import { screenTimeScore } from '@/lib/screenTimeScore';
import { reportAiContent } from '@/services/aiReports';
import { generateEnoughTimeInsights } from '@/services/insights';
import { getInstalledApps, getPermissionStatus } from '@/services/nativeUsage';
import { appsOverLimit, todayDayIndex } from '@/lib/usageLimits';
import { trackedAppIds } from '@/lib/trackedApps';
import { colors, fonts, spacing } from '@/theme';
import { resetAllStores, useApps, useGoals, useSubscription, useUsage } from '@/store';

function SectionHeader({ title }: { title: string }) {
  return (
    <Txt variant="subheading" style={styles.sectionHeader}>
      {title}
    </Txt>
  );
}

function SectionBody({ children }: { children: string }) {
  return (
    <Txt variant="body" color={colors.textMuted} style={styles.sectionBody}>
      {children}
    </Txt>
  );
}

function formatMeterMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(minutes % 60 === 0 ? 0 : 1)} hr${hours === 1 ? '' : 's'}`;
}

function formatCompactMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(minutes % 60 === 0 ? 0 : 1)}h`;
}

export default function Progress() {
  const insets = useSafeAreaInsets();
  const week = useUsage((s) => s.week);
  const selectedDayIndex = useUsage((s) => s.selectedDayIndex);
  const selectDay = useUsage((s) => s.selectDay);
  const syncUsage = useUsage((s) => s.syncFromDevice);
  const avgScreenTimeMinutes = useUsage((s) => s.avgScreenTimeMinutes);
  const commitRate = useUsage((s) => s.commitRate);
  const commits = useUsage((s) => s.commits);
  const wastes = useUsage((s) => s.wastes);
  const lastCommitAt = useUsage((s) => s.lastCommitAt);
  const weekHours = useUsage((s) => s.weekHours);
  const softSpots = useUsage((s) => s.softSpots);

  const selectedIds = useApps((s) => s.selectedIds);
  const groups = useApps((s) => s.groups);
  const goalText = useGoals((s) => s.text);
  const lastGoalUpdatedAt = useGoals((s) => s.lastGoalUpdatedAt);
  const lastGoalPromptedAt = useGoals((s) => s.lastGoalPromptedAt);
  const markGoalPromptShown = useGoals((s) => s.markGoalPromptShown);
  const trialExpired = useSubscription((s) => s.trialExpired);

  const [refreshing, setRefreshing] = useState(false);
  const [showTrial, setShowTrial] = useState(false);
  const [insightLine, setInsightLine] = useState<string | null>(null);
  const [usageAccessGranted, setUsageAccessGranted] = useState(true);
  const [usageReady, setUsageReady] = useState(false);
  const [showGoalsRefresh, setShowGoalsRefresh] = useState(false);

  const hours = weekHours();
  const todayIndex = todayDayIndex(week);
  const todayMinutes = week[todayIndex]
    ? Object.values(week[todayIndex].byApp).reduce((sum, minutes) => sum + minutes, 0)
    : avgScreenTimeMinutes();
  const totalLost = formatCompactMinutes(hours * 60);
  const dailyMetric = avgScreenTimeMinutes() > 0 ? formatCompactMinutes(avgScreenTimeMinutes()) : '--';
  const score = screenTimeScore({
    todayMinutes,
    avgDailyMinutes: avgScreenTimeMinutes(),
    groups,
    commitRate: commitRate(),
  });
  const [displayScore, setDisplayScore] = useState(score);
  const [scoreLift, setScoreLift] = useState(0);
  const scorePulse = useMemo(() => new Animated.Value(0), []);
  const goals = useMemo(
    () =>
      goalText
        .split('\n')
        .map((line) => line.replace(/^[-*\s]+/, '').trim())
        .filter(Boolean),
    [goalText],
  );
  const goalsKey = goals.join('\n');
  const appIds = useMemo(() => trackedAppIds(selectedIds, groups), [selectedIds, groups]);
  const selectedDayLabel = week[selectedDayIndex]?.label ?? 'Today';
  const viewingToday = selectedDayIndex === todayIndex;
  useFocusEffect(
    useCallback(() => {
      const currentTime = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const goalsAreStale = !lastGoalUpdatedAt || currentTime - lastGoalUpdatedAt > weekMs;
      const promptIsAllowed = !lastGoalPromptedAt || currentTime - lastGoalPromptedAt > weekMs;
      if (goalsAreStale && promptIsAllowed) {
        setShowGoalsRefresh(true);
        markGoalPromptShown();
      }
      void syncUsage(appIds);
      if (trialExpired()) setShowTrial(true);
    }, [appIds, lastGoalPromptedAt, lastGoalUpdatedAt, markGoalPromptShown, syncUsage, trialExpired]),
  );

  useEffect(() => {
    let cancelled = false;
    void syncUsage(appIds.length ? appIds : []).finally(() => {
      if (!cancelled) setUsageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [appIds, syncUsage]);

  useEffect(() => {
    let cancelled = false;
    void getPermissionStatus('usage').then((granted) => {
      if (!cancelled) setUsageAccessGranted(granted);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshing]);

  useEffect(() => {
    if (!usageReady) return;
    if (hours <= 0) {
      Promise.resolve().then(() => setInsightLine(null));
      return;
    }
    let cancelled = false;
    void generateEnoughTimeInsights(hours, goals).then((lines) => {
      if (!cancelled) setInsightLine(lines[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [goals, goalsKey, hours, usageReady]);

  useEffect(() => {
    const recentCommit = lastCommitAt && Date.now() - lastCommitAt < 12_000 && commits > 0;
    if (!recentCommit) {
      Promise.resolve().then(() => {
        setDisplayScore(score);
        setScoreLift(0);
      });
      return;
    }

    const previousCommitRate =
      commits - 1 + wastes > 0 ? Math.round(((commits - 1) / (commits - 1 + wastes)) * 100) : 0;
    const previousScore = screenTimeScore({
      todayMinutes,
      avgDailyMinutes: avgScreenTimeMinutes(),
      groups,
      commitRate: previousCommitRate,
    });
    const start = Math.min(previousScore, score);
    const lift = Math.max(0, score - start);
    Promise.resolve().then(() => {
      setDisplayScore(start);
      setScoreLift(lift);
      scorePulse.setValue(0);
    });

    const duration = 900;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (score - start) * eased));
      if (progress >= 1) clearInterval(tick);
    }, 32);
    Animated.sequence([
      Animated.timing(scorePulse, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(scorePulse, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();

    return () => clearInterval(tick);
  }, [avgScreenTimeMinutes, commits, groups, lastCommitAt, score, scorePulse, todayMinutes, wastes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const granted = await getPermissionStatus('usage');
    setUsageAccessGranted(granted);
    await getInstalledApps();
    await syncUsage(appIds);
    if (hours > 0) {
      const lines = await generateEnoughTimeInsights(weekHours(), goals);
      setInsightLine(lines[0] ?? null);
    }
    setRefreshing(false);
  }, [appIds, goals, hours, syncUsage, weekHours]);

  const visibleWeek = useMemo(() => week.slice(-7), [week]);
  const selectedVisibleIndex = Math.max(0, selectedDayIndex - Math.max(0, week.length - visibleWeek.length));
  const selectVisibleDay = useCallback(
    (index: number) => {
      selectDay(Math.max(0, week.length - visibleWeek.length) + index);
    },
    [selectDay, visibleWeek.length, week.length],
  );
  const barData: BarDatum[] = visibleWeek.map((d) => ({
    label: d.label,
    value: Object.values(d.byApp).reduce((a, b) => a + b, 0),
  }));

  const spots = softSpots(selectedDayIndex);
  const overLimit = useMemo(
    () => (viewingToday ? appsOverLimit(spots, groups) : []),
    [spots, groups, viewingToday],
  );
  const overLimitIds = useMemo(() => new Set(overLimit.map((o) => o.appId)), [overLimit]);
  const selectedUsage = week[selectedDayIndex]?.byApp ?? {};
  const sessionSummaries = groups.map((group) => {
    const usedMinutes = group.appIds.reduce((sum, id) => sum + (selectedUsage[id] ?? 0), 0);
    const dailyLimitMinutes = Math.round(group.limitHours * 60);
    const sessionCount = group.sessionCount ?? 3;
    const sessionMinutes =
      group.sessionLimitMinutes ?? Math.max(1, Math.round(dailyLimitMinutes / sessionCount));
    const sessionsSpent =
      usedMinutes >= dailyLimitMinutes
        ? sessionCount
        : usedMinutes > 0
          ? Math.max(1, Math.floor(usedMinutes / sessionMinutes))
          : 0;
    const sessionsLeft = Math.max(0, sessionCount - sessionsSpent);
    return {
      id: group.id,
      name: group.name,
      timeLeft: Math.max(0, dailyLimitMinutes - usedMinutes),
      sessionsLeft,
      sessionCount,
      sessionMinutes,
      dailyLimitMinutes,
      usedMinutes,
    };
  });
  const overLimitRecommendation = useMemo(() => {
    if (!overLimit.length) return null;
    const hour = new Date().getHours();
    if (hour >= 21) {
      return {
        title: 'You usually slip at night',
        body: 'Protect tomorrow with a 10:00 PM Lock-In.',
        cta: 'Protect Tomorrow Night',
      };
    }
    if (hour < 10) {
      return {
        title: 'Mornings have been tough lately',
        body: 'Start clean tomorrow from 7:30 AM to 8:30 AM.',
        cta: 'Protect Tomorrow Morning',
      };
    }
    return {
      title: 'Protect your next weak spot',
      body: 'Set a Lock-In for the time you usually scroll most.',
      cta: 'Set a Lock-In',
    };
  }, [overLimit.length]);

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

  const reportInsight = async () => {
    if (!insightLine) return;
    await reportAiContent('progress.enough-time', insightLine);
    Alert.alert('Report sent', 'Thanks. We will use this to improve HopOff suggestions.');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.black} />}>
      <ScreenTitle title="Progress" subtitle="Your screen time, your limits, and what you are taking back." />

      <GlassCard style={styles.scoreHero}>
        <View style={styles.scoreLayout}>
          <View style={styles.scoreMain}>
            <Txt variant="caption" color={colors.textMuted}>
              SCORE
            </Txt>
            <View style={styles.scoreHeroRow}>
              <Animated.View
                style={[
                  styles.scoreAnimated,
                  {
                    transform: [
                      {
                        scale: scorePulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.08],
                        }),
                      },
                    ],
                  },
                ]}>
                <Txt style={styles.scoreValue}>{displayScore}</Txt>
              </Animated.View>
              <Txt variant="caption" color={colors.textMuted}>
                /100
              </Txt>
            </View>
            {scoreLift > 0 ? (
              <Animated.View
                style={[
                  styles.scoreLift,
                  {
                    opacity: scorePulse.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: scorePulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, -8],
                        }),
                      },
                    ],
                  },
                ]}>
                <Txt variant="caption" color={colors.success}>
                  +{scoreLift} for committing
                </Txt>
              </Animated.View>
            ) : null}
          </View>
          <View style={styles.scoreMetrics}>
            <View style={styles.scoreMini}>
              <Txt variant="caption" color={colors.textFaint} numberOfLines={1}>
                DAILY
              </Txt>
              <Txt style={styles.scoreMiniValue} numberOfLines={1} adjustsFontSizeToFit>
                {dailyMetric}
              </Txt>
            </View>
            <View style={styles.scoreMini}>
              <Txt variant="caption" color={colors.textFaint} numberOfLines={1}>
                WASTED
              </Txt>
              <Txt style={styles.scoreMiniValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalLost}
              </Txt>
            </View>
          </View>
        </View>
      </GlassCard>

      {usageReady && hours > 0 && insightLine ? (
        <View style={styles.enoughCard}>
          <Txt variant="caption" color={colors.textFaint}>
            {`THAT'S ENOUGH TIME TO`}
          </Txt>
          <Txt style={styles.enoughText}>{insightLine}</Txt>
          <Pressable onPress={reportInsight} hitSlop={8} style={styles.reportAiButton}>
            <Icon name="flag" size={14} color={colors.textFaint} />
            <Txt variant="caption" color={colors.textFaint}>
              Report suggestion
            </Txt>
          </Pressable>
        </View>
      ) : hours <= 0 && Platform.OS === 'android' && !usageAccessGranted ? (
        <View style={styles.section}>
          <SectionHeader title="Usage access needed" />
          <SectionBody>
            Turn on Usage access for HopOff in Settings, then pull down to refresh. If the toggle
            looks on but data is still empty, switch it off and on again.
          </SectionBody>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Recent days" />
        <BarChart data={barData} selectedIndex={selectedVisibleIndex} onSelect={selectVisibleDay} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your soft spots" />
        {spots.length === 0 ? (
          <SectionBody>
            {viewingToday
              ? 'No tracked app usage yet today.'
              : `No tracked app usage on ${selectedDayLabel}.`}
          </SectionBody>
        ) : (
          <View style={styles.spotList}>
            {spots.map((spot) => {
              const app = getApp(spot.appId);
              if (!app) return null;
              const over = overLimitIds.has(spot.appId);
              return (
                <GlassCard key={spot.appId} style={styles.spotRow}>
                  <AppIcon brand={app.brand} size={36} />
                  <Txt variant="bodyStrong" style={styles.spotName} numberOfLines={1}>
                    {app.name}
                  </Txt>
                  <Txt variant="body" color={over ? '#E8807C' : colors.textMuted}>
                    {formatHoursUnit(spot.minutes / 60)}
                  </Txt>
                </GlassCard>
              );
            })}
          </View>
        )}
      </View>

      {sessionSummaries.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={`${viewingToday ? 'Today' : selectedDayLabel}'s limit meter`} />
          <View style={styles.sessionList}>
            {sessionSummaries.map((summary) => (
              <GlassCard key={summary.id} style={styles.sessionMeter}>
                <View style={styles.sessionMeterHeader}>
                  <View style={styles.sessionText}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {summary.name}
                    </Txt>
                    <Txt variant="caption" color={colors.textMuted} numberOfLines={1} adjustsFontSizeToFit>
                      {summary.sessionsLeft} session{summary.sessionsLeft === 1 ? '' : 's'} / {formatMeterMinutes(summary.timeLeft)} left
                    </Txt>
                  </View>
                  <Txt
                    variant="bodyStrong"
                    color={colors.textMuted}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    style={styles.sessionUsage}>
                    {formatMeterMinutes(summary.usedMinutes)} / {formatMeterMinutes(summary.dailyLimitMinutes)}
                  </Txt>
                </View>
                <View style={styles.segmentRow}>
                  {Array.from({ length: summary.sessionCount }).map((_, index) => {
                    const fill = Math.max(
                      0,
                      Math.min(1, (summary.usedMinutes - index * summary.sessionMinutes) / summary.sessionMinutes),
                    );
                    const depleted = summary.sessionsLeft === 0;
                    return (
                      <View
                        key={`${summary.id}-${index}`}
                        style={[
                          styles.sessionSegment,
                          depleted && styles.sessionSegmentDepleted,
                        ]}>
                        <View
                          style={[
                            styles.sessionSegmentFill,
                            depleted && styles.sessionSegmentFillDepleted,
                            { width: `${fill * 100}%` },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            ))}
          </View>
          {overLimitRecommendation ? (
            <GlassCard style={styles.recommendationCard}>
              <View style={styles.recommendationCopy}>
                <Txt variant="bodyStrong">{overLimitRecommendation.title}</Txt>
                <Txt variant="body" color={colors.textMuted}>
                  {overLimitRecommendation.body}
                </Txt>
              </View>
              <PillButton
                label={overLimitRecommendation.cta}
                variant="dark"
                onPress={() => router.push('/(tabs)/lock-in')}
              />
            </GlassCard>
          ) : null}
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
        <Pressable style={styles.footerBtn} onPress={confirmResetData}>
          <Icon name="logout" size={18} color={colors.textMuted} />
          <Txt variant="body" color={colors.textMuted}>
            Reset app data
          </Txt>
        </Pressable>
      </View>

      <TrialPaywallModal visible={showTrial} onClose={() => setShowTrial(false)} />
      <PopupPanel visible={showGoalsRefresh} onClose={() => setShowGoalsRefresh(false)} variant="center">
        <View style={styles.goalsPopup}>
          <Txt variant="title" center>
            What do you want to accomplish this week?
          </Txt>
          <Txt variant="body" color={colors.textMuted} center>
            Update this once a week so HopOff knows what to push you toward.
          </Txt>
          <GoalsEditor minHeight={170} placeholder={'Examples:\nRead before bed\nGo to the gym\nCall my family'} />
          <PillButton
            label="Save this week"
            disabled={!goalText.trim()}
            onPress={() => setShowGoalsRefresh(false)}
          />
        </View>
      </PopupPanel>
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
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    color: colors.text,
  },
  sectionBody: {
    fontFamily: fonts.regular,
    fontWeight: '300',
  },
  scoreHero: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: 30,
  },
  scoreLayout: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  scoreMain: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
    position: 'relative',
    alignItems: 'flex-start',
  },
  scoreHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  scoreAnimated: {
    justifyContent: 'flex-end',
  },
  scoreValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 58,
    lineHeight: 68,
    color: colors.text,
  },
  scoreLift: {
    position: 'absolute',
    left: 0,
    bottom: -18,
  },
  scoreMetrics: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  scoreMini: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },
  scoreMiniValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 29,
    color: colors.text,
    textAlign: 'center',
  },
  enoughCard: {
    borderRadius: 26,
    backgroundColor: colors.black,
    padding: spacing.xl,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  enoughText: {
    fontFamily: fonts.displayBlack,
    fontSize: 20,
    lineHeight: 27,
    color: colors.white,
  },
  reportAiButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  spotList: {
    gap: spacing.sm,
  },
  sessionList: {
    gap: spacing.sm,
  },
  sessionMeter: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  sessionMeterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sessionText: {
    flex: 1,
    minWidth: 0,
  },
  sessionUsage: {
    flexShrink: 1,
    minWidth: 82,
    textAlign: 'right',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sessionSegment: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  sessionSegmentFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.black,
    opacity: 1,
  },
  sessionSegmentDepleted: {
    borderColor: colors.danger,
  },
  sessionSegmentFillDepleted: {
    backgroundColor: colors.danger,
    opacity: 1,
  },
  recommendationCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderColor: colors.glassBorder,
  },
  recommendationCopy: {
    gap: spacing.xs,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  spotName: {
    flex: 1,
    minWidth: 0,
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
  goalsPopup: {
    gap: spacing.lg,
  },
});
