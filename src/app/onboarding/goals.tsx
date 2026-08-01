import { router } from 'expo-router';

import { View } from 'react-native';

import { GoalsEditor, OnboardingShell, PillButton, ScreenTitle } from '@/components';
import { useGoals } from '@/store';

export default function GoalsStep() {
  const text = useGoals((s) => s.text);
  const hasText = text.trim().length > 0;

  return (
    <OnboardingShell
      stepIndex={3}
      onBack={() => router.back()}
      footer={
        <View style={{ gap: 8 }}>
          <PillButton
            label="Continue"
            variant="primary"
            disabled={!hasText}
            onPress={() => {
              router.push('/onboarding/redirect');
            }}
          />
        </View>
      }>
      <ScreenTitle
        title="What are you taking your time back for?"
        subtitle="Write a few specific goals. HopOff uses these to make your reset feel personal."
      />
      <GoalsEditor
        minHeight={230}
        placeholder={'Read before bed\nGo to the gym after school\nPractice guitar\nSpend more time with family'}
      />
    </OnboardingShell>
  );
}
