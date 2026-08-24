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
  getLocalePreference,
  saveLocalePreference,
} from '../services';
import {
  resolvePreference,
  setActiveLocale,
  type Locale,
  type LocalePreference,
} from '../i18n';
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
  /** 实际生效的语言 */
  locale: Locale;
  /** 用户的选择，可能是 'system' */
  localePreference: LocalePreference;
  setLocalePreference: (pref: LocalePreference) => Promise<void>;
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
  locale: 'en',
  localePreference: 'system',
  setLocalePreference: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [tier, setTierState] = useState<Tier>('free');
  const [localePreference, setLocalePreferenceState] = useState<LocalePreference>('system');
  const [locale, setLocaleState] = useState<Locale>(() => resolvePreference('system'));

  useEffect(() => {
    (async () => {
      const [onboarded, key, savedTier, savedLocale] = await Promise.all([
        isOnboardingComplete(),
        getApiKey(),
        getTier(),
        getLocalePreference(),
      ]);
      setOnboardingDoneState(onboarded);
      setApiKeyState(key);
      setTierState(savedTier);
      applyLocale(savedLocale);
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

  // services / utils 里的纯函数拿不到 React context，
  // 所以要把生效语言同步到模块级变量，两边保持一致。
  const applyLocale = useCallback((pref: LocalePreference) => {
    const resolved = resolvePreference(pref);
    setActiveLocale(resolved);
    setLocalePreferenceState(pref);
    setLocaleState(resolved);
  }, []);

  const setLocalePreference = useCallback(
    async (pref: LocalePreference) => {
      await saveLocalePreference(pref);
      applyLocale(pref);
    },
    [applyLocale]
  );

  const setTier = useCallback(async (t: Tier) => {
    await saveTier(t);
    setTierState(t);
  }, []);

  return (
    <AppContext.Provider
      value={{
        onboardingDone, loading, apiKey, tier,
        setOnboardingDone, setApiKey, removeApiKey, setTier,
        locale, localePreference, setLocalePreference,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
