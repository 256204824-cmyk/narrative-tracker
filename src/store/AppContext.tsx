import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isOnboardingComplete,
  getApiKey,
  saveApiKey,
  deleteApiKey,
  setOnboardingComplete as markOnboarded,
  clearOnboardingComplete,
  getTier,
  saveTier,
} from '../services';
import type { Tier } from '../types';

interface AppState {
  onboardingDone: boolean;
  loading: boolean;
  apiKey: string | null;
  tier: Tier;
  setOnboardingDone: (done: boolean) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  removeApiKey: () => Promise<void>;
  setTier: (tier: Tier) => Promise<void>;
}

const AppContext = createContext<AppState>({
  onboardingDone: false,
  loading: true,
  apiKey: null,
  tier: 'free',
  setOnboardingDone: async () => {},
  setApiKey: async () => {},
  removeApiKey: async () => {},
  setTier: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [tier, setTierState] = useState<Tier>('free');

  useEffect(() => {
    (async () => {
      const [onboarded, key, savedTier] = await Promise.all([
        isOnboardingComplete(),
        getApiKey(),
        getTier(),
      ]);
      setOnboardingDoneState(onboarded);
      setApiKeyState(key);
      setTierState(savedTier);
      setLoading(false);
    })();
  }, []);

  const setOnboardingDone = useCallback(async (done: boolean) => {
    // 两个方向都要落盘：置回 false 时若不清除标记，
    // 删除数据后 App 会卡在没有自我画像的主界面。
    if (done) {
      await markOnboarded();
    } else {
      await clearOnboardingComplete();
    }
    setOnboardingDoneState(done);
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    await saveApiKey(key);
    setApiKeyState(key);
  }, []);

  const removeApiKey = useCallback(async () => {
    await deleteApiKey();
    setApiKeyState(null);
  }, []);

  const setTier = useCallback(async (t: Tier) => {
    await saveTier(t);
    setTierState(t);
  }, []);

  return (
    <AppContext.Provider
      value={{ onboardingDone, loading, apiKey, tier, setOnboardingDone, setApiKey, removeApiKey, setTier }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
