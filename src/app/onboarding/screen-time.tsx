import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HourWheel, OnboardingShell, PillButton, ScreenTitle } from '@/components';
import { formatDailyScreenTime } from '@/lib/format';
import { spacing } from '@/theme';
import { useOnboarding } from '@/store';

export default function ScreenTimeStep() {
  const storedGuess = useOnboarding((s) => s.guessedScreenTimeMinutes);
  const setGuess = useOnboarding((s) => s.setGuessedScreenTimeMinutes);
  const guess = storedGuess ?? 180;
  const guessedFormatted = formatDailyScreenTime(guess);

  return (
    <OnboardingShell
      stepIndex={0}
      onBack={() => router.back()}
      footer={
        <PillButton
          label="Check My Guess"
          onPress={() =>
            router.push({
              pathname: '/onboarding/permissions',
              params: { next: '/onboarding/screen-time-results', step: '1' },
            })
          }
        />
      }>
      <ScreenTitle
        title="Daily screen time?"
        subtitle="Pick your honest daily estimate. HopOff will check it against your phone next."
      />

      <View style={styles.wheelWrap}>
        <HourWheel
          value={guess / 60}
          onChange={(hours) => setGuess(Math.round(hours * 60))}
          min={0.5}
          max={8}
          step={0.25}
          size={310}
          centerBig={guessedFormatted.value}
          centerSmall={guessedFormatted.unit}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  wheelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
});
