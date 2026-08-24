import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../store/AppContext';
import { exportAllData, deleteAllData, getFactLogCount, getAllSelfPortraits } from '../database';
import { importAllData } from '../database';
import { validateImport } from '../utils/importValidation';
import * as DocumentPicker from 'expo-document-picker';
import { readTextFile } from '../utils/readTextFile';
import { saveTextFile } from '../utils/saveTextFile';
import {
  PROVIDER_PRESETS,
  matchPreset,
  type DataPolicy,
  type ProviderPreset,
} from '../services/providerPresets';
import { useT } from '../i18n/useT';
import { TIER_LIMITS } from '../constants/questions';
import { localeOptions, messagesFor, type LocalePreference } from '../i18n';
import { today } from '../utils/date';
import { notify, confirmDestructive } from '../utils/dialog';
import type { SelfPortrait } from '../types';
import {
  DEFAULT_PROVIDER,
  getProviderConfig,
  saveProviderConfig,
  checkBaseUrl,
  normalizeBaseUrl,
} from '../services/provider';
import type { Tier } from '../types';

const TIERS: { key: Tier; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'plus', label: 'Plus' },
  { key: 'pro', label: 'Pro' },
];

interface Props {
  onReassess: () => void;
}

export default function SettingsScreen({ onReassess }: Props) {
  const t = useT();
  const { apiKey, setApiKey, removeApiKey, tier, setTier, setOnboardingDone,
    localePreference, setLocalePreference, locale } = useAppState();
  const [keyInput, setKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [factCount, setFactCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [portraits, setPortraits] = useState<SelfPortrait[]>([]);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_PROVIDER.baseUrl);
  const [model, setModel] = useState(DEFAULT_PROVIDER.model);
  const [editingProvider, setEditingProvider] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // 用 useFocusEffect 而不是 useEffect：重评页是模态，返回时本组件不会重新挂载，
  // 只有重新聚焦才能刷新出刚保存的那一版画像。
  useFocusEffect(
    useCallback(() => {
      getFactLogCount().then(setFactCount).catch(() => {});
      getAllSelfPortraits().then(setPortraits).catch(() => {});
      getProviderConfig()
        .then((c) => {
          setBaseUrl(c.baseUrl);
          setModel(c.model);
        })
        .catch(() => {});
    }, [])
  );

  const handleSaveKey = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      notify(t.settings.keyInvalid);
      return;
    }
    await setApiKey(trimmed);
    setKeyInput('');
    setShowKeyInput(false);
    notify(t.common.saved, t.settings.keySavedBody);
  };

  const handleRemoveKey = async () => {
    const ok = await confirmDestructive(
      t.settings.keyRemoveTitle,
      t.settings.keyRemoveBody,
      t.common.delete
    );
    if (!ok) return;
    await removeApiKey();
    notify(t.common.deleted);
  };

  const handleSaveProvider = async () => {
    const check = checkBaseUrl(baseUrl);
    if (!check.ok) {
      notify(t.settings.providerInvalidTitle, check.error);
      return;
    }
    if (!model.trim()) {
      notify(t.settings.providerNeedModelTitle, t.settings.providerNeedModelBody);
      return;
    }
    await saveProviderConfig({ baseUrl, model });
    setBaseUrl(normalizeBaseUrl(baseUrl));
    setEditingProvider(false);
    notify(t.common.saved, check.warning ?? t.settings.providerSavedBody);
  };

  const policyText = (policy: DataPolicy) =>
    policy === 'local'
      ? t.settings.policyLocal
      : policy === 'noRetainNoTrain'
        ? t.settings.policyNoRetainNoTrain
        : policy === 'retainNoTrain'
          ? t.settings.policyRetainNoTrain
          : policy === 'mayTrain'
            ? t.settings.policyMayTrain
            : t.settings.policyUnknown;

  const applyPreset = async (preset: ProviderPreset) => {
    const changedProvider = matchPreset(baseUrl)?.id !== preset.id;
    await saveProviderConfig({ baseUrl: preset.baseUrl, model: preset.model });
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setPresetsOpen(false);
    setEditingProvider(false);

    // 换 provider 必须换 Key。之前只改 URL 不提示，用户拿着上一家的 Key
    // 请求新服务，只会收到一个 401——这是最容易踩、也最难自己想明白的坑。
    if (preset.needsKey && changedProvider) {
      notify(t.common.saved, t.settings.presetKeyReminder(preset.name));
    } else {
      notify(t.common.saved, t.settings.presetApplied(preset.name));
    }
  };

  const handleResetProvider = async () => {
    await saveProviderConfig(DEFAULT_PROVIDER);
    setBaseUrl(DEFAULT_PROVIDER.baseUrl);
    setModel(DEFAULT_PROVIDER.model);
    setEditingProvider(false);
    notify(t.settings.providerResetDone, `${DEFAULT_PROVIDER.baseUrl} · ${DEFAULT_PROVIDER.model}`);
  };

  const handleImport = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    setImporting(true);
    try {
      const raw = await readTextFile(picked.assets[0].uri);

      const result = validateImport(raw);
      if (!result.ok) {
        notify(t.settings.importRejected, result.error);
        return;
      }

      const { self_portraits, fact_logs } = result.data;
      const ok = await confirmDestructive(
        t.settings.importTitle,
        t.settings.importBody(self_portraits.length, fact_logs.length),
        t.settings.importConfirm
      );
      if (!ok) return;

      const counts = await importAllData(result.data);
      // 导入的数据里有画像就直接进主界面，没有则回到画像流程
      await setOnboardingDone(counts.portraits > 0);
      setFactCount(counts.facts);
      setPortraits(await getAllSelfPortraits());
      notify(t.settings.importDone, t.settings.importDoneBody(counts.facts, counts.portraits, counts.analyses));
    } catch (err) {
      notify(t.settings.importFailed, String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleSeedDemo = async () => {
    const ok = await confirmDestructive(
      t.settings.devSeedTitle,
      t.settings.devSeedBody,
      t.settings.devSeedConfirm
    );
    if (!ok) return;
    setSeeding(true);
    try {
      // 动态 import：静态引入会把 100KB 演示文本连同十种语言一起打进正式包，
      // 而这块本该「__DEV__ 为 false 时整块不存在」。
      const { seedDemoData } = await import('../dev/seed');
      const r = await seedDemoData(locale);
      await setOnboardingDone(true);
      setFactCount(r.facts);
      setPortraits(await getAllSelfPortraits());
      await setTier('plus');
      notify(t.settings.devSeedDone, t.settings.devSeedDoneBody(r.facts, r.from, r.to));
    } catch (err) {
      notify(t.settings.devSeedFailed, String(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportAllData();
      const filename = `narrative_tracker_export_${today()}.json`;
      const where = await saveTextFile(filename, json, t.settings.exportDialogTitle);
      notify(t.settings.exportOkTitle, t.settings.exportOkBody(where));
    } catch (err) {
      notify(t.settings.exportFailed, t.common.retry);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    const ok = await confirmDestructive(
      t.settings.deleteAllTitle,
      t.settings.deleteAllBody,
      t.settings.deleteAllConfirm
    );
    if (!ok) return;
    try {
      await deleteAllData();
      setFactCount(0);
      // 自我画像已被删除，必须同时清掉 onboarding 标记，
      // 否则 App 会停在主界面且再也无法重建画像。
      await setOnboardingDone(false);
      notify(t.common.deleted, t.settings.deleteAllDone);
    } catch (err) {
      notify(t.settings.deleteFailed, t.common.retry);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.settings.title}</Text>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.languageTitle}</Text>
          <Text style={styles.sectionDesc}>{t.settings.languageDesc}</Text>

          {/* 11 个选项平铺太占地方，收成一栏；展开选完自动收起。
              收起时显示当前生效的语言，跟随系统时把实际语言也带出来，
              否则用户只看到「跟随系统」，不知道系统被识别成了哪种语言。 */}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.localeToggle}
            onPress={() => setLanguageOpen((v) => !v)}
          >
            <Text style={styles.localeCurrent}>
              {localePreference === 'system'
                ? `${t.settings.languageSystem} · ${messagesFor(locale).locale.name}`
                : messagesFor(localePreference).locale.name}
            </Text>
            <Text style={styles.localeChevron}>{languageOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {languageOpen && (
            <View style={styles.localeList}>
              {[
                { locale: 'system' as const, name: t.settings.languageSystem },
                ...localeOptions(),
              ].map((opt) => {
                const selected = localePreference === opt.locale;
                return (
                  <TouchableOpacity
            accessibilityRole="button"
                    key={opt.locale}
                    style={[styles.localeRow, selected && styles.localeRowSelected]}
                    onPress={async () => {
                      await setLocalePreference(opt.locale as LocalePreference);
                      setLanguageOpen(false);
                    }}
                  >
                    <Text style={[styles.localeName, selected && styles.localeNameSelected]}>
                      {opt.name}
                    </Text>
                    {selected && <Text style={styles.localeCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.keyTitle}</Text>
          <Text style={styles.sectionDesc}>
            {t.settings.keyDesc}
          </Text>
          {apiKey && !showKeyInput ? (
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>{t.settings.keySet}</Text>
              <Text style={styles.keyPreview}>
                {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
              </Text>
              <View style={styles.keyActions}>
                {/* 换服务商就要换 Key，先删再加会经过一个「没有 Key」的
                    危险中间态——这时点生成报告只会得到「未设置 Key」。 */}
                <TouchableOpacity
                  style={styles.actionBtnSmall}
                  onPress={() => {
                    setKeyInput('');
                    setShowKeyInput(true);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionBtnText}>{t.common.modify}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dangerBtnSmall}
                  onPress={handleRemoveKey}
                  accessibilityRole="button"
                >
                  <Text style={styles.dangerBtnText}>{t.settings.keyRemove}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {showKeyInput ? (
                <View>
                  <TextInput
                    style={styles.keyInput}
                    placeholder={t.settings.keyPlaceholder}
                    placeholderTextColor="#bbb"
                    value={keyInput}
                    onChangeText={setKeyInput}
                    secureTextEntry
                    autoFocus
                  />
                  <View style={styles.keyButtons}>
                    <TouchableOpacity
            accessibilityRole="button"
                      style={styles.cancelBtnSmall}
                      onPress={() => {
                        setShowKeyInput(false);
                        setKeyInput('');
                      }}
                    >
                      <Text style={styles.cancelBtnTextSmall}>{t.common.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
            accessibilityRole="button" style={styles.saveBtnSmall} onPress={handleSaveKey}>
                      <Text style={styles.saveBtnTextSmall}>{t.common.save}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
            accessibilityRole="button" style={styles.addKeyBtn} onPress={() => setShowKeyInput(true)}>
                  <Text style={styles.addKeyBtnText}>{t.settings.keyAdd}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Provider Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.providerTitle}</Text>
          <Text style={styles.sectionDesc}>
            {t.settings.providerDesc}
          </Text>

          <Text style={styles.presetsLabel}>{t.settings.presetsTitle}</Text>
          <Text style={styles.presetsDesc}>{t.settings.presetsDesc}</Text>

          <TouchableOpacity
            accessibilityRole="button" style={styles.localeToggle} onPress={() => setPresetsOpen((v) => !v)}>
            <Text style={styles.localeCurrent}>
              {matchPreset(baseUrl)?.name ?? baseUrl}
            </Text>
            <Text style={styles.localeChevron}>{presetsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {presetsOpen && (
            <View style={styles.localeList}>
              {PROVIDER_PRESETS.map((preset) => {
                const selected = matchPreset(baseUrl)?.id === preset.id;
                const risky = preset.policy === 'mayTrain' || preset.policy === 'unknown';
                return (
                  <TouchableOpacity
            accessibilityRole="button"
                    key={preset.id}
                    style={[styles.presetRow, selected && styles.localeRowSelected]}
                    onPress={() => applyPreset(preset)}
                  >
                    <View style={styles.presetHead}>
                      <Text style={[styles.localeName, selected && styles.localeNameSelected]}>
                        {preset.name}
                      </Text>
                      {preset.free && <Text style={styles.tagFree}>{t.settings.presetFree}</Text>}
                      {!preset.needsKey && (
                        <Text style={styles.tagNoKey}>{t.settings.presetNoKey}</Text>
                      )}
                      {preset.needsComputer && (
                        <Text style={styles.tagComputer}>{t.settings.presetNeedsComputer}</Text>
                      )}
                      {selected && <Text style={styles.localeCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.presetPolicy, risky && styles.presetPolicyRisky]}>
                      {policyText(preset.policy)}
                    </Text>
                    <Text
                      style={styles.presetLink}
                      onPress={() => Linking.openURL(preset.signupUrl)}
                    >
                      {t.settings.presetGetKey}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {editingProvider ? (
            <View>
              <Text style={styles.fieldLabel}>{t.settings.baseUrlLabel}</Text>
              <TextInput
                style={styles.keyInput}
                placeholder={DEFAULT_PROVIDER.baseUrl}
                placeholderTextColor="#bbb"
                value={baseUrl}
                onChangeText={setBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.fieldHint}>
                {t.settings.baseUrlHint}
              </Text>

              <Text style={styles.fieldLabel}>{t.settings.modelLabel}</Text>
              <TextInput
                style={styles.keyInput}
                placeholder={DEFAULT_PROVIDER.model}
                placeholderTextColor="#bbb"
                value={model}
                onChangeText={setModel}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.keyButtons}>
                <TouchableOpacity
            accessibilityRole="button"
                  style={styles.cancelBtnSmall}
                  onPress={() => {
                    setEditingProvider(false);
                    getProviderConfig().then((c) => {
                      setBaseUrl(c.baseUrl);
                      setModel(c.model);
                    });
                  }}
                >
                  <Text style={styles.cancelBtnTextSmall}>{t.common.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
            accessibilityRole="button" style={styles.saveBtnSmall} onPress={handleSaveProvider}>
                  <Text style={styles.saveBtnTextSmall}>{t.common.save}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
            accessibilityRole="button" style={styles.resetBtn} onPress={handleResetProvider}>
                <Text style={styles.resetBtnText}>{t.settings.providerReset}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>{t.settings.baseUrlLabel}</Text>
              <Text style={styles.providerValue}>{baseUrl}</Text>
              <Text style={[styles.keyLabel, styles.providerLabelGap]}>{t.settings.modelLabel}</Text>
              <Text style={styles.providerValue}>{model}</Text>
              <TouchableOpacity
            accessibilityRole="button"
                style={styles.actionBtnSmall}
                onPress={() => setEditingProvider(true)}
              >
                <Text style={styles.actionBtnText}>{t.common.modify}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Self Portrait Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.portraitTitle}</Text>
          <Text style={styles.sectionDesc}>
            {portraits.length > 1
              ? t.settings.portraitDescVersions(portraits.length)
              : t.settings.portraitDescEmpty}
          </Text>
          <TouchableOpacity
            accessibilityRole="button" style={styles.actionBtn} onPress={onReassess}>
            <Text style={styles.actionBtnText}>{t.settings.portraitReassess}</Text>
          </TouchableOpacity>

          {portraits.length > 0 && (
            <View style={styles.portraitList}>
              {portraits.slice(0, 5).map((p, i) => (
                <View key={p.id} style={styles.portraitRow}>
                  <Text style={styles.portraitDate}>
                    {p.created_at.split(' ')[0]}
                    {i === 0 ? t.settings.portraitLatest : ''}
                  </Text>
                  <Text style={styles.portraitScores}>
                    {t.settings.portraitScores(p.discipline_score, p.engagement_score,
                      p.procrastination_score, p.persistence_score)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tier Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.tierTitle}</Text>
          <Text style={styles.sectionDesc}>{t.settings.tierDesc}</Text>
          <View style={styles.tierRow}>
            {TIERS.map((tierOption) => (
              <TouchableOpacity
            accessibilityRole="button"
                key={tierOption.key}
                style={[styles.tierCard, tier === tierOption.key && styles.tierCardSelected]}
                onPress={() => setTier(tierOption.key)}
              >
                <Text
                  style={[styles.tierLabel, tier === tierOption.key && styles.tierLabelSelected]}
                >
                  {tierOption.label}
                </Text>
                <Text style={[styles.tierDesc, tier === tierOption.key && styles.tierDescSelected]}>
                  {tierOption.key === 'free'
                    ? t.settings.tierFree(TIER_LIMITS.free)
                    : tierOption.key === 'plus'
                      ? t.settings.tierPlus
                      : t.settings.tierPro}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.dataTitle}</Text>
          <Text style={styles.sectionDesc}>
            {t.settings.dataDesc(factCount)}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.actionBtn}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.actionBtnText}>
              {exporting ? t.settings.exporting : t.settings.export}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button" style={styles.actionBtn} onPress={handleImport} disabled={importing}>
            <Text style={styles.actionBtnText}>
              {importing ? t.settings.importing : t.settings.import}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button" style={styles.dangerBtn} onPress={handleDeleteAll}>
            <Text style={styles.dangerBtnTextLarge}>{t.settings.deleteAll}</Text>
          </TouchableOpacity>
        </View>

        {/* 仅开发模式可见 —— 生产构建里整块不存在 */}
        {__DEV__ && (
          <View style={[styles.section, styles.devSection]}>
            <Text style={styles.sectionTitle}>{t.settings.devTitle}</Text>
            <Text style={styles.sectionDesc}>
              {t.settings.devDesc}
            </Text>
            <TouchableOpacity
            accessibilityRole="button"
              style={styles.actionBtn}
              onPress={handleSeedDemo}
              disabled={seeding}
            >
              <Text style={styles.actionBtnText}>
                {seeding ? t.settings.devSeeding : t.settings.devSeed}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.privacyTitle}</Text>
          <View style={styles.privacyCard}>
            {t.settings.privacyLines.map((line) => (
              <Text key={line} style={styles.privacyItem}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.version}>{t.settings.footer}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8fc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 4 },
  fieldHint: { fontSize: 12, color: '#999', marginTop: -6, marginBottom: 8 },
  providerValue: { fontSize: 14, color: '#333', fontWeight: '500', marginTop: 2 },
  providerLabelGap: { marginTop: 12 },
  actionBtnSmall: {
    marginTop: 14,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetBtn: { paddingVertical: 12, alignItems: 'center' },
  resetBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  devSection: { borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  localeToggle: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  localeCurrent: { fontSize: 15, color: '#1a1a2e', fontWeight: '600', flexShrink: 1 },
  localeChevron: { fontSize: 10, color: '#999', marginLeft: 8 },
  localeList: { marginTop: 8, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  presetsLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 12 },
  presetsDesc: { fontSize: 12, color: '#999', lineHeight: 17, marginTop: 4 },
  presetRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  presetHead: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tagFree: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tagNoKey: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  presetPolicy: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 17 },
  presetLink: { fontSize: 12, color: '#4f46e5', fontWeight: '600', marginTop: 6 },
  tagComputer: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  presetPolicyRisky: { color: '#b45309' },
  localeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  localeRowSelected: { backgroundColor: '#eef2ff' },
  localeName: { fontSize: 15, color: '#333' },
  localeNameSelected: { color: '#4f46e5', fontWeight: '700' },
  localeCheck: { fontSize: 15, color: '#4f46e5', fontWeight: '700' },
  portraitList: { marginTop: 12, gap: 8 },
  portraitRow: { borderLeftWidth: 2, borderLeftColor: '#e8e8f0', paddingLeft: 10, paddingVertical: 2 },
  portraitDate: { fontSize: 13, fontWeight: '600', color: '#555' },
  portraitScores: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionDesc: { fontSize: 13, color: '#999', marginBottom: 12, lineHeight: 18 },
  keyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  keyLabel: { fontSize: 13, color: '#22c55e', fontWeight: '600', marginBottom: 4 },
  keyActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  keyPreview: { fontSize: 14, color: '#333', fontFamily: 'monospace', marginBottom: 10 },
  keyInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e8e8f0',
    fontFamily: 'monospace',
  },
  keyButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtnSmall: {
    flex: 1,
    backgroundColor: '#e8e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnTextSmall: { color: '#555', fontSize: 14, fontWeight: '600' },
  saveBtnSmall: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnTextSmall: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addKeyBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d0d0dd',
    borderStyle: 'dashed',
  },
  addKeyBtnText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
  dangerBtnSmall: { alignSelf: 'flex-start' },
  dangerBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  tierRow: { flexDirection: 'row', gap: 10 },
  tierCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tierCardSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  tierLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  tierLabelSelected: { color: '#4f46e5' },
  tierDesc: { fontSize: 11, color: '#999', textAlign: 'center' },
  tierDescSelected: { color: '#6366f1' },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d0dd',
  },
  actionBtnText: { color: '#333', fontSize: 14, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: '#fff3f3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerBtnTextLarge: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  privacyCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
  },
  privacyItem: { fontSize: 14, color: '#3730a3', lineHeight: 26, fontWeight: '500' },
  version: { fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 10 },
});
