import { router } from 'expo-router';
import { useState } from 'react';

import { GoalsEditor, OnboardingShell, PillButton, ScreenTitle } from '@/components';
import { polishGoals } from '@/services/aiPolish';
import { haptics } from '@/lib/haptics';
import { useGoals } from '@/store';

export default function GoalsStep() {
  const text = useGoals((s) => s.text);
  const setText = useGoals((s) => s.setText);
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState(false);

  const hasText = text.trim().length > 0;

  const onPolish = async () => {
    setPolishing(true);
    const cleaned = await polishGoals(text);
    setText(cleaned);
    setPolishing(false);
    setPolished(true);
    haptics.success();
  };

  const footer = polished ? (
    <PillButton label="Continue" onPress={() => router.push('/onboarding/videos')} />
  ) : (
    <PillButton
      label={polishing ? 'Polishing your list…' : 'Polish my list'}
      loading={polishing}
      disabled={!hasText}
      onPress={onPolish}
    />
  );

  return (
    <OnboardingShell stepIndex={4} onBack={() => router.back()} footer={footer}>
      <ScreenTitle
        title="Define your weekly goals."
        subtitle="These become the alternatives we surface when you hit a limit."
      />
      <GoalsEditor minHeight={150} placeholder="e.g. Read 10 pages&#10;Go to the gym&#10;Call my family" />
    </OnboardingShell>
  );
}
