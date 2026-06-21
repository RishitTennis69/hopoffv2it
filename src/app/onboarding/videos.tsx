import { router } from 'expo-router';
import { useRef, useState } from 'react';

import {
  CollectionManager,
  ConfirmModal,
  OnboardingShell,
  PillButton,
  ScreenTitle,
} from '@/components';
import { useVideos } from '@/store';

export default function VideosStep() {
  const library = useVideos((s) => s.library);
  const initialIds = useRef(library.map((v) => v.id).join('|'));
  const [selectMode, setSelectMode] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);

  const proceed = () => router.push('/onboarding/permissions');

  const onContinue = () => {
    const current = library.map((v) => v.id).join('|');
    if (current === initialIds.current) setShowDefaults(true);
    else proceed();
  };

  const footer = selectMode ? null : (
    <PillButton
      label={library.length === 0 ? 'Add at least one video' : 'Continue'}
      disabled={library.length === 0}
      onPress={onContinue}
    />
  );

  return (
    <OnboardingShell stepIndex={5} onBack={() => router.back()} footer={footer}>
      <ScreenTitle
        title="Here's your starter library."
        subtitle="We added three to get you going. Make it yours"
      />
      <CollectionManager searchLabel="Add your own videos" onSelectModeChange={setSelectMode} />

      <ConfirmModal
        visible={showDefaults}
        title="Keep the starter picks?"
        message="You haven't changed your library — we'll keep the three starter clips. You can edit them anytime."
        confirmLabel="Keep starter picks"
        cancelLabel="Go back"
        onConfirm={() => {
          setShowDefaults(false);
          proceed();
        }}
        onCancel={() => setShowDefaults(false)}
      />
    </OnboardingShell>
  );
}
