import React from 'react';
import SelfPortraitForm from './SelfPortraitForm';
import { useAppState } from '../store/AppContext';
import { useT } from '../i18n/useT';

export default function OnboardingScreen() {
  const { setOnboardingDone } = useAppState();
  const t = useT();

  return (
    <SelfPortraitForm
      title={t.portrait.onboardingTitle}
      subtitle={t.portrait.onboardingSubtitle}
      submitLabel={t.portrait.onboardingSubmit}
      onSaved={() => setOnboardingDone(true)}
    />
  );
}
