import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { HourWheel, Icon, OnboardingShell, PillButton, ScreenTitle, SelectRow } from '@/components';
import type { IconName } from '@/components';
import { jumpToStep } from '@/lib/onboardingSteps';
import { colors, spacing } from '@/theme';
import { TRIGGER_OPTIONS, useOnboarding } from '@/store';

/** Two onboarding questions (priorities step was removed). */
const QUESTION_COUNT = 2;

function parseQuestionStep(q: string | string[] | undefined): number {
  const raw = Array.isArray(q) ? q[0] : q;
  const n = Number(raw ?? 0);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), QUESTION_COUNT - 1);
}

export default function Questions() {
  const params = useLocalSearchParams<{ q?: string }>();
  const step = parseQuestionStep(params.q);

  const triggers = useOnboarding((s) => s.triggers);
  const toggleTrigger = useOnboarding((s) => s.toggleTrigger);
  const dailyHours = useOnboarding((s) => s.dailyHours);
  const setDailyHours = useOnboarding((s) => s.setDailyHours);

  const goToStep = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), QUESTION_COUNT - 1);
    router.setParams({ q: String(clamped) });
  };

  const back = () => {
    if (step > 0) goToStep(step - 1);
    else router.back();
  };

  const goNext = () => {
    if (step === 0 && triggers.length === 0) return;
    if (step < QUESTION_COUNT - 1) {
      goToStep(step + 1);
      return;
    }
    router.push('/onboarding/apps');
  };

  const isLastQuestion = step >= QUESTION_COUNT - 1;
  const canAdvanceTriggers = triggers.length > 0;

  const footer = isLastQuestion ? (
    <PillButton label="Continue" onPress={goNext} />
  ) : (
    <PillButton
      key={canAdvanceTriggers ? 'triggers-ready' : 'triggers-empty'}
      label={canAdvanceTriggers ? 'Next' : 'Choose one to continue'}
      onPress={goNext}
      disabled={!canAdvanceTriggers}
    />
  );

  return (
    <OnboardingShell
      stepIndex={step}
      onBack={back}
      onJump={(i) => {
        if (i <= 1) goToStep(i);
        else jumpToStep(i);
      }}
      footer={footer}>
      {step === 0 ? (
        <Animated.View key="q0" entering={FadeInRight} exiting={FadeOutLeft} style={styles.group}>
          <ScreenTitle title="When do apps pull you off track?" />
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
          <ScreenTitle title="How much time do you want back each day?" />
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
