import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import {
  ConfirmModal,
  HourWheel,
  Icon,
  OnboardingShell,
  PillButton,
  RankingList,
  ScreenTitle,
  SelectRow,
  Txt,
} from '@/components';
import type { IconName } from '@/components';
import { colors, spacing } from '@/theme';
import { DEFAULT_PRIORITIES, TRIGGER_OPTIONS, useOnboarding } from '@/store';

const PRIORITY_ICONS: Record<string, IconName> = {
  'Be more present': 'present',
  'Hit my goals': 'goals',
  'Sleep better': 'sleep',
  'Build better habits': 'habits',
};

export default function Questions() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [step, setStep] = useState(Number(params.q ?? 0));

  const triggers = useOnboarding((s) => s.triggers);
  const toggleTrigger = useOnboarding((s) => s.toggleTrigger);
  const dailyHours = useOnboarding((s) => s.dailyHours);
  const setDailyHours = useOnboarding((s) => s.setDailyHours);
  const priorities = useOnboarding((s) => s.priorities);
  const prioritiesTouched = useOnboarding((s) => s.prioritiesTouched);
  const setPriorities = useOnboarding((s) => s.setPriorities);

  const [showDefaults, setShowDefaults] = useState(false);

  const back = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const goNext = () => setStep(step + 1);

  const finishQuestions = () => router.push('/onboarding/apps');

  const onContinueRanking = () => {
    if (!prioritiesTouched) setShowDefaults(true);
    else finishQuestions();
  };

  // --- footers per sub-step ---
  const footer =
    step === 0 ? (
      <PillButton label="Next" onPress={goNext} disabled={triggers.length === 0} />
    ) : step === 1 ? (
      <PillButton label="Next" onPress={goNext} />
    ) : (
      <PillButton label="Continue" onPress={onContinueRanking} />
    );

  return (
    <OnboardingShell stepIndex={step} onBack={back} onJump={(i) => (i <= 2 ? setStep(i) : undefined)} footer={footer}>
      {step === 0 ? (
        <Animated.View key="q0" entering={FadeInRight} exiting={FadeOutLeft} style={styles.group}>
          <ScreenTitle title="When do you reach for your phone most?" />
          <View style={{ gap: spacing.md }}>
            {TRIGGER_OPTIONS.map((opt) => (
              <SelectRow
                key={opt.id}
                label={opt.label}
                selected={triggers.includes(opt.id)}
                onPress={() => toggleTrigger(opt.id)}
                left={
                  <View style={styles.triggerIcon}>
                    <Icon name={opt.icon as IconName} size={18} color={colors.text} />
                  </View>
                }
              />
            ))}
          </View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="q1" entering={FadeInRight} exiting={FadeOutLeft} style={styles.group}>
          <ScreenTitle title="How much time do you lose to your phone each day?" />
          <View style={styles.wheelWrap}>
            <HourWheel
              value={dailyHours}
              onChange={setDailyHours}
              min={1}
              max={7}
              step={1}
              centerBig={`${dailyHours}`}
              centerSmall={dailyHours === 1 ? 'Hour' : 'Hours'}
            />
          </View>
        </Animated.View>
      ) : null}

      {step === 2 ? (
        <Animated.View key="q2" entering={FadeInRight} exiting={FadeOutLeft} style={styles.group}>
          <ScreenTitle title="What should HopOff prioritize for you?" />
          <Txt variant="body" color={colors.textMuted} center>
            Press and hold a row, then drag to reorder — #1 is your top priority
          </Txt>
          <RankingList
            items={priorities}
            onChange={(next) => setPriorities(next, true)}
            iconFor={(label) => PRIORITY_ICONS[label] ?? 'goals'}
          />
        </Animated.View>
      ) : null}

      <ConfirmModal
        visible={showDefaults}
        title="Keep the default order?"
        message="You haven't reordered your priorities — we'll use the default order. You can change this anytime."
        confirmLabel="Use defaults"
        cancelLabel="Go back"
        onConfirm={() => {
          setPriorities(DEFAULT_PRIORITIES, false);
          setShowDefaults(false);
          finishQuestions();
        }}
        onCancel={() => setShowDefaults(false)}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xl,
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrap: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
});
