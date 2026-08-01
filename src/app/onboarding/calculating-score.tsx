import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GlassCard, Txt } from '@/components';
import { screenTimeScore } from '@/lib/screenTimeScore';
import { todayDayIndex } from '@/lib/usageLimits';
import { colors, fonts, spacing } from '@/theme';
import { useApps, useOnboarding, useSubscription, useUsage } from '@/store';

const COMPLETE_DELAY_MS = 3400;
const PHRASE_INTERVAL_MS = 1050;
const FINAL_REVEAL_DELAY_MS = 2600;
const FINAL_COUNT_DURATION_MS = 620;
const CALCULATING_PHRASES = [
  'Reading your screen time.',
  'Checking your limits.',
  'Building your reset.',
];

export default function CalculatingScore() {
  const pulse = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(12);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const displayScoreRef = useRef(12);
  const week = useUsage((s) => s.week);
  const avgScreenTimeMinutes = useUsage((s) => s.avgScreenTimeMinutes);
  const commitRate = useUsage((s) => s.commitRate);
  const groups = useApps((s) => s.groups);
  const guessedScreenTimeMinutes = useOnboarding((s) => s.guessedScreenTimeMinutes);
  const completeOnboarding = useOnboarding((s) => s.complete);
  const startTrial = useSubscription((s) => s.startTrial);

  const score = useMemo(() => {
    const todayIndex = todayDayIndex(week);
    const today = week[todayIndex];
    const syncedTodayMinutes = today ? Object.values(today.byApp).reduce((sum, minutes) => sum + minutes, 0) : 0;
    const fallbackMinutes = avgScreenTimeMinutes() || guessedScreenTimeMinutes || 180;
    const todayMinutes = syncedTodayMinutes > 0 ? syncedTodayMinutes : fallbackMinutes;
    return screenTimeScore({
      todayMinutes,
      avgDailyMinutes: avgScreenTimeMinutes() || todayMinutes,
      groups,
      commitRate: commitRate(),
    });
  }, [avgScreenTimeMinutes, commitRate, groups, guessedScreenTimeMinutes, week]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })),
      -1,
      true,
    );
    const timer = setTimeout(() => {
      startTrial();
      completeOnboarding();
      router.replace('/(tabs)/progress');
    }, COMPLETE_DELAY_MS);
    let countTimer: ReturnType<typeof setInterval> | null = null;
    let scoreTimer: ReturnType<typeof setInterval> | null = null;
    const phraseTimer = setInterval(() => {
      setPhraseIndex((current) => Math.min(CALCULATING_PHRASES.length - 1, current + 1));
    }, PHRASE_INTERVAL_MS);
    const revealTimer = setTimeout(() => {
      setShowFinalScore(true);
      if (phraseTimer) clearInterval(phraseTimer);
      if (scoreTimer) clearInterval(scoreTimer);
      const start = displayScoreRef.current;
      const duration = FINAL_COUNT_DURATION_MS;
      const startedAt = Date.now();
      countTimer = setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const next = Math.round(start + (score - start) * eased);
        displayScoreRef.current = next;
        setDisplayScore(next);
        if (progress >= 1) {
          displayScoreRef.current = score;
          setDisplayScore(score);
          clearInterval(countTimer);
        }
      }, 32);
    }, FINAL_REVEAL_DELAY_MS);
    scoreTimer = setInterval(() => {
      setDisplayScore((current) => {
        const next = ((current * 7 + 23) % 94) + 5;
        displayScoreRef.current = next;
        return next;
      });
    }, 72);
    return () => {
      clearTimeout(timer);
      clearTimeout(revealTimer);
      if (phraseTimer) clearInterval(phraseTimer);
      if (scoreTimer) clearInterval(scoreTimer);
      if (countTimer) clearInterval(countTimer);
    };
  }, [completeOnboarding, pulse, score, startTrial]);

  const dotOne = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.65 }));
  const dotTwo = useAnimatedStyle(() => ({ opacity: 1 - pulse.value * 0.65 }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.42 + pulse.value * 0.32,
    transform: [{ rotate: `${pulse.value * 360}deg` }, { scale: 0.98 + pulse.value * 0.04 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(220)} style={styles.inner}>
        <GlassCard style={styles.card}>
          <Animated.View entering={FadeInUp.springify().damping(12)} style={styles.scoreWrap}>
            <Animated.View style={[styles.scoreRing, ringStyle]} />
            <View style={styles.scoreOrb}>
              <Txt style={styles.scoreText}>{displayScore}</Txt>
            </View>
          </Animated.View>
          <View style={styles.copy}>
            <Animated.View key={showFinalScore ? 'final' : CALCULATING_PHRASES[phraseIndex]} entering={FadeIn.duration(180)}>
              <Txt variant="title" center>
                {showFinalScore ? 'Your first reset starts today.' : CALCULATING_PHRASES[phraseIndex]}
              </Txt>
            </Animated.View>
          </View>
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, dotOne]} />
            <Animated.View style={[styles.dot, dotTwo]} />
            <Animated.View style={[styles.dot, dotOne]} />
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.screenH,
  },
  inner: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xl,
    padding: spacing.xl,
  },
  scoreOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreWrap: {
    width: 182,
    height: 182,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRing: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    borderWidth: 2,
    borderTopColor: colors.black,
    borderRightColor: colors.glassBorder,
    borderBottomColor: colors.glassBorder,
    borderLeftColor: colors.black,
  },
  scoreText: {
    fontFamily: fonts.displayBlack,
    fontSize: 76,
    lineHeight: 82,
    color: colors.white,
  },
  copy: {
    gap: spacing.sm,
  },
  statusLine: {
    minHeight: 28,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.black,
  },
});
