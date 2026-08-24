import React from 'react';
import SelfPortraitForm from './SelfPortraitForm';
import { useAppState } from '../store/AppContext';

export default function OnboardingScreen() {
  const { setOnboardingDone } = useAppState();

  return (
    <SelfPortraitForm
      title="了解你自己"
      subtitle="以下问题没有正确答案，如实回答就好。"
      submitLabel="完成初始画像"
      onSaved={() => setOnboardingDone(true)}
    />
  );
}
