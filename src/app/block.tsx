import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, BackHandler, Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockVideoFrame, EncryptedText, Icon, PillButton, Txt } from '@/components';
import { getApp } from '@/data/apps';
import { reportAiContent } from '@/services/aiReports';
import { generateBlockAlternative } from '@/services/insights';
import { colors, spacing } from '@/theme';
import { useApps, useGoals, useUsage, useVideos } from '@/store';
import type { VideoClip } from '@/store/types';
import { launchLimitedApp, snoozeApp } from '../../modules/hopoff-monitor/src';

const SCROLL_SNOOZE_MINUTES = 15;
const MAX_BLOCK_VIDEO_SECONDS = 60;
const BLOCK_LINES = [
  'Stop scrolling now.',
  'Your time is up.',
  'Close the feed.',
  'You hit your limit.',
  'Do not keep scrolling.',
  'Hop off this app.',
];

function fallbackAlternative(lines: string[]): string {
  const first = lines[0]?.toLowerCase() ?? '';
  if (first.includes('read')) return 'read 5 pages of your next book';
  if (first.includes('run')) return 'take a 10-minute run';
  if (first.includes('workout') || first.includes('gym') || first.includes('train')) return 'do one focused workout set';
  if (first.includes('study')) return 'study one focused page';
  return lines[0] ?? 'do one thing that moves your life forward';
}

function formatInsteadGoal(line: string): string {
  const trimmed = line
    .trim()
    .replace(/^(instead of|instead|as your goal,?|you could|try to|go )\s+/i, '')
    .replace(/^to\s+/i, '');
  if (!trimmed) return 'Instead, do one thing that moves your life forward';
  const normalized = trimmed
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bmine\b/gi, 'yours')
    .replace(/\bmyself\b/gi, 'yourself')
    .replace(
    /^(practicing|training|running|reading|writing|studying|calling|cleaning|walking|working)\b/i,
    (match) =>
      ({
        practicing: 'practice',
        training: 'train',
        running: 'run',
        reading: 'read',
        writing: 'write',
        studying: 'study',
        calling: 'call',
        cleaning: 'clean',
        walking: 'walk',
        working: 'work',
      })[match.toLowerCase()] ?? match,
  );
  const goal = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  return `Instead, ${goal}`;
}

export default function BlockScreen() {
  const insets = useSafeAreaInsets();
  const { appId, reason, scheduleLabel } = useLocalSearchParams<{ appId?: string; reason?: string; scheduleLabel?: string }>();
  const library = useVideos((s) => s.library);
  const groups = useApps((s) => s.groups);
  const goalLines = useGoals((s) => s.goalLines);
  const goalApp = useGoals((s) => s.goalApp);
  const recordCommit = useUsage((s) => s.recordCommit);
  const recordWaste = useUsage((s) => s.recordWaste);

  const limitedApp = appId ? getApp(appId) : undefined;
  const [clip] = useState<VideoClip | null>(() => {
    const pool = library.filter((v) => v.durationSec > 0 && v.durationSec <= MAX_BLOCK_VIDEO_SECONDS);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  });
  const [alternative, setAlternative] = useState<string | null>(null);
  const [videoFinished, setVideoFinished] = useState(false);
  const [blockLine] = useState(() => BLOCK_LINES[Math.floor(Math.random() * BLOCK_LINES.length)]);
  const [screenFocused, setScreenFocused] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [videoEnabled, setVideoEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      setVideoEnabled(true);
      return () => {
        setScreenFocused(false);
        setVideoEnabled(false);
      };
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const goals = goalLines();
    void generateBlockAlternative(goals).then((line) => {
      if (!cancelled) setAlternative(line || fallbackAlternative(goals));
    });
    return () => {
      cancelled = true;
    };
  }, [goalLines]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const dismissToHopOff = () => {
    setVideoEnabled(false);
    recordCommit(0);
    router.replace('/(tabs)/progress');
  };

  const openGoalApp = () => {
    setVideoEnabled(false);
    recordCommit(0);
    router.replace('/(tabs)/progress');

    if (!goalApp) return;

    void (async () => {
      if (goalApp.packageId) {
        const launched = await launchLimitedApp(goalApp.packageId).catch(() => false);
        if (launched) return;
      }

      const urls = goalApp.urls ?? (goalApp.url ? [goalApp.url] : []);
      for (const url of urls) {
        const canOpen = await Linking.canOpenURL(url).catch(() => false);
        if (canOpen) {
          await Linking.openURL(url).catch(() => undefined);
          return;
        }
      }
    })();
  };

  const onScroll = () => {
    setVideoEnabled(false);
    recordWaste();
    if (limitedApp?.id) void snoozeApp(limitedApp.id, SCROLL_SNOOZE_MINUTES);
    if (limitedApp?.packageId) {
      void launchLimitedApp(limitedApp.packageId);
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const reportSuggestion = async () => {
    await reportAiContent('block.alternative', goalText);
    Alert.alert('Report sent', 'Thanks. We will use this to improve HopOff suggestions.');
  };

  const appName = limitedApp?.name;
  const groupForApp = limitedApp ? groups.find((group) => group.appIds.includes(limitedApp.id)) : undefined;
  const sessionMinutes = groupForApp
    ? groupForApp.sessionLimitMinutes ?? Math.round((groupForApp.limitHours * 60) / (groupForApp.sessionCount ?? 1))
    : null;
  const dailyLimitMinutes = groupForApp ? Math.round(groupForApp.limitHours * 60) : null;
  const contextLine =
    reason === 'lockin'
      ? 'Lock In is active.'
      : reason === 'schedule' && scheduleLabel === 'Morning'
        ? 'Morning block is active.'
        : reason === 'schedule' && scheduleLabel === 'Night'
          ? 'Night block is active.'
          : reason === 'schedule'
            ? 'Scheduled block is active.'
            : reason === 'limit' && appName && dailyLimitMinutes
              ? `${dailyLimitMinutes}-minute ${appName} limit reached.`
              : reason === 'session' && appName && sessionMinutes && sessionMinutes > 1
                ? `${sessionMinutes}-minute ${appName} session is up.`
                : appName
                  ? `${appName} is blocked right now.`
                  : 'This app is blocked right now.';
  const goalText = formatInsteadGoal(alternative ?? fallbackAlternative(goalLines()));

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}>
      {!videoFinished ? (
        <Animated.View exiting={FadeOut.duration(650)} style={styles.videoArea}>
          <View style={styles.interruptHeader}>
            <Txt style={styles.interruptTitle} center>
              {blockLine}
            </Txt>
            <Txt variant="caption" color={colors.textFaint} center>
              {contextLine}
            </Txt>
          </View>
          {clip ? (
            <>
              <BlockVideoFrame
                clip={clip}
                playing={videoEnabled && screenFocused && appActive}
                onVideoFinished={() => setVideoFinished(true)}
              />
            </>
          ) : (
            <Pressable onPress={() => setVideoFinished(true)} style={styles.noVideo}>
              <Txt variant="bodyStrong" color={colors.white} center>
                Continue
              </Txt>
            </Pressable>
          )}
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeIn.duration(650)} style={styles.commitArea}>
            <View style={styles.goalCard}>
              <Txt variant="caption" color={colors.textMuted} center>
                DO THIS INSTEAD
              </Txt>
              <EncryptedText text={goalText} duration={650} color={colors.text} center style={styles.goalText} />
              <Pressable onPress={reportSuggestion} hitSlop={8} style={styles.reportAiButton}>
                <Icon name="flag" size={14} color={colors.textMuted} />
                <Txt variant="caption" color={colors.textMuted}>
                  Report suggestion
                </Txt>
              </Pressable>
            </View>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(650).delay(250)} style={styles.footer}>
            <PillButton
              variant="primary"
              label={goalApp ? `Open ${goalApp.name}` : 'Back to HopOff'}
              onPress={goalApp ? openGoalApp : dismissToHopOff}
            />
            <Pressable onPress={onScroll} hitSlop={12} style={styles.scrollHit}>
              <Txt variant="caption" color={colors.textFaint} center>
                Let me scroll
              </Txt>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screenH,
  },
  videoArea: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  interruptHeader: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  interruptTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 34,
    lineHeight: 39,
    color: colors.text,
  },
  interruptSubhead: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 21,
  },
  commitArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  goalCard: {
    alignSelf: 'stretch',
    minHeight: 190,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  goalText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 30,
    lineHeight: 37,
  },
  reportAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  footer: {
    flexShrink: 0,
    minHeight: 96,
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
  },
  scrollHit: {
    paddingTop: spacing.sm,
  },
  noVideo: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.black,
  },
});
