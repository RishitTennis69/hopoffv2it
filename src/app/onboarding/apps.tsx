import { router } from 'expo-router';

import { AppsManager, OnboardingShell, PillButton, ScreenTitle } from '@/components';
import { useApps } from '@/store';

export default function AppsStep() {
  const groups = useApps((s) => s.groups);
  const hasGroupWithLimit = groups.some((g) => g.limitHours > 0);

  return (
    <OnboardingShell
      stepIndex={3}
      onBack={() => router.back()}
      footer={
        <PillButton
          label="Continue"
          disabled={!hasGroupWithLimit}
          onPress={() => router.push('/onboarding/goals')}
        />
      }>
      <ScreenTitle
        title="Select the apps to limit."
        subtitle="Pick what's on your phone, then group them with a daily limit."
      />
      <AppsManager />
    </OnboardingShell>
  );
}
