import { router } from 'expo-router';

import { AppsManager, OnboardingShell, PillButton, ScreenTitle } from '@/components';
import { useApps } from '@/store';

export default function AppsStep() {
  const groups = useApps((s) => s.groups);
  const hasGroupWithLimit = groups.some((g) => g.limitHours > 0);

  return (
    <OnboardingShell
      stepIndex={6}
      onBack={() => router.back()}
      footer={
        <PillButton
          label={hasGroupWithLimit ? 'Continue' : 'Choose apps and set a limit'}
          disabled={!hasGroupWithLimit}
          onPress={() => router.push('/onboarding/sessions')}
        />
      }>
      <ScreenTitle
        title="Pick the apps that pull you off track."
        subtitle="Select apps, then tap Set Their Limit. HopOff will block that set when the time runs out."
      />
      <AppsManager showSessionControls={false} />
    </OnboardingShell>
  );
}
