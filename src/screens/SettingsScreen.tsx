import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAppState } from '../store/AppContext';
import { exportAllData, deleteAllData, getFactLogCount, getAllSelfPortraits } from '../database';
import { seedDemoData } from '../dev/seed';
import { importAllData } from '../database';
import { validateImport } from '../utils/importValidation';
import * as DocumentPicker from 'expo-document-picker';
import { readTextFile } from '../utils/readTextFile';
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

const TIERS: { key: Tier; label: string; desc: string }[] = [
  { key: 'free', label: 'Free', desc: '最近 7 天反馈' },
  { key: 'plus', label: 'Plus', desc: '最近 1 个月反馈' },
  { key: 'pro', label: 'Pro', desc: '最近 1 年反馈' },
];

interface Props {
  onReassess: () => void;
}

export default function SettingsScreen({ onReassess }: Props) {
  const { apiKey, setApiKey, removeApiKey, tier, setTier, setOnboardingDone } = useAppState();
  const [keyInput, setKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [factCount, setFactCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [portraits, setPortraits] = useState<SelfPortrait[]>([]);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_PROVIDER.baseUrl);
  const [model, setModel] = useState(DEFAULT_PROVIDER.model);
  const [editingProvider, setEditingProvider] = useState(false);
  const [seeding, setSeeding] = useState(false);
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
      notify('请输入有效的 API Key');
      return;
    }
    await setApiKey(trimmed);
    setKeyInput('');
    setShowKeyInput(false);
    notify('已保存', 'API Key 已安全存储在设备中。');
  };

  const handleRemoveKey = async () => {
    const ok = await confirmDestructive(
      '删除 API Key',
      '删除后将无法使用 AI 分析功能。确定删除？',
      '删除'
    );
    if (!ok) return;
    await removeApiKey();
    notify('已删除');
  };

  const handleSaveProvider = async () => {
    const check = checkBaseUrl(baseUrl);
    if (!check.ok) {
      notify('base URL 无效', check.error);
      return;
    }
    if (!model.trim()) {
      notify('请填写模型名', '不同 provider 的模型名不同，例如 gpt-4o-mini、deepseek-chat。');
      return;
    }
    await saveProviderConfig({ baseUrl, model });
    setBaseUrl(normalizeBaseUrl(baseUrl));
    setEditingProvider(false);
    notify('已保存', check.warning ?? '之后的分析请求会发往这个地址。');
  };

  const handleResetProvider = async () => {
    await saveProviderConfig(DEFAULT_PROVIDER);
    setBaseUrl(DEFAULT_PROVIDER.baseUrl);
    setModel(DEFAULT_PROVIDER.model);
    setEditingProvider(false);
    notify('已恢复默认', `${DEFAULT_PROVIDER.baseUrl} · ${DEFAULT_PROVIDER.model}`);
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
        notify('无法导入', result.error);
        return;
      }

      const { self_portraits, fact_logs } = result.data;
      const ok = await confirmDestructive(
        '导入数据',
        `即将导入 ${self_portraits.length} 个自我画像版本和 ${fact_logs.length} 条事实记录。\n\n这会替换掉当前设备上的全部数据，且不可撤销。建议先导出一份当前数据作为备份。`,
        '替换并导入'
      );
      if (!ok) return;

      const counts = await importAllData(result.data);
      // 导入的数据里有画像就直接进主界面，没有则回到画像流程
      await setOnboardingDone(counts.portraits > 0);
      setFactCount(counts.facts);
      setPortraits(await getAllSelfPortraits());
      notify('导入完成', `${counts.facts} 条事实、${counts.portraits} 个画像版本、${counts.analyses} 份历史分析。`);
    } catch (err) {
      notify('导入失败', String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleSeedDemo = async () => {
    const ok = await confirmDestructive(
      '载入演示数据',
      '这会先清空当前所有数据，再写入 30 天的模拟记录，并把档位设为 Plus。仅用于预览界面效果。确定继续？',
      '清空并载入'
    );
    if (!ok) return;
    setSeeding(true);
    try {
      const r = await seedDemoData();
      await setOnboardingDone(true);
      setFactCount(r.facts);
      setPortraits(await getAllSelfPortraits());
      await setTier('plus');
      notify('已载入', `${r.facts} 天演示记录（${r.from} ~ ${r.to}），档位已设为 Plus。`);
    } catch (err) {
      notify('载入失败', String(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportAllData();
      const filename = `narrative_tracker_export_${today()}.json`;
      const file = new File(Paths.document, filename);
      await file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: '导出叙事数据',
        });
      } else {
        notify('导出成功', `文件已保存到：${file.uri}`);
      }
    } catch (err) {
      notify('导出失败', '请重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    const ok = await confirmDestructive(
      '删除所有数据',
      '此操作不可撤销。所有自我画像、事实记录和分析结果将被永久删除，App 会回到初始自我画像流程。确定继续？',
      '永久删除'
    );
    if (!ok) return;
    try {
      await deleteAllData();
      setFactCount(0);
      // 自我画像已被删除，必须同时清掉 onboarding 标记，
      // 否则 App 会停在主界面且再也无法重建画像。
      await setOnboardingDone(false);
      notify('已删除', '所有本地数据已被清除。');
    } catch (err) {
      notify('删除失败', '请重试');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>设置</Text>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI API Key</Text>
          <Text style={styles.sectionDesc}>
            你提供的 Key 直接保存在设备安全存储中，不会上传到任何服务器。
          </Text>
          {apiKey ? (
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>已设置 Key</Text>
              <Text style={styles.keyPreview}>
                {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
              </Text>
              <TouchableOpacity style={styles.dangerBtnSmall} onPress={handleRemoveKey}>
                <Text style={styles.dangerBtnText}>删除 Key</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {showKeyInput ? (
                <View>
                  <TextInput
                    style={styles.keyInput}
                    placeholder="sk-..."
                    placeholderTextColor="#bbb"
                    value={keyInput}
                    onChangeText={setKeyInput}
                    secureTextEntry
                    autoFocus
                  />
                  <View style={styles.keyButtons}>
                    <TouchableOpacity
                      style={styles.cancelBtnSmall}
                      onPress={() => {
                        setShowKeyInput(false);
                        setKeyInput('');
                      }}
                    >
                      <Text style={styles.cancelBtnTextSmall}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveKey}>
                      <Text style={styles.saveBtnTextSmall}>保存</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.addKeyBtn} onPress={() => setShowKeyInput(true)}>
                  <Text style={styles.addKeyBtnText}>+ 添加 API Key</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Provider Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Provider</Text>
          <Text style={styles.sectionDesc}>
            任何兼容 OpenAI 接口格式的服务都可以用，包括跑在本机的模型。
          </Text>

          {editingProvider ? (
            <View>
              <Text style={styles.fieldLabel}>Base URL</Text>
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
                填到 /v1 为止，不要带 /chat/completions
              </Text>

              <Text style={styles.fieldLabel}>模型</Text>
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
                  style={styles.cancelBtnSmall}
                  onPress={() => {
                    setEditingProvider(false);
                    getProviderConfig().then((c) => {
                      setBaseUrl(c.baseUrl);
                      setModel(c.model);
                    });
                  }}
                >
                  <Text style={styles.cancelBtnTextSmall}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtnSmall} onPress={handleSaveProvider}>
                  <Text style={styles.saveBtnTextSmall}>保存</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={handleResetProvider}>
                <Text style={styles.resetBtnText}>恢复默认（OpenAI）</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>Base URL</Text>
              <Text style={styles.providerValue}>{baseUrl}</Text>
              <Text style={[styles.keyLabel, styles.providerLabelGap]}>模型</Text>
              <Text style={styles.providerValue}>{model}</Text>
              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => setEditingProvider(true)}
              >
                <Text style={styles.actionBtnText}>修改</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Self Portrait Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自我画像</Text>
          <Text style={styles.sectionDesc}>
            {portraits.length > 1
              ? `已保存 ${portraits.length} 个版本。每次重评都会新增一版，旧版本全部保留。`
              : '你对自己的看法会变。定期重评，才能看出叙事本身的变化。'}
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={onReassess}>
            <Text style={styles.actionBtnText}>重新评价自我画像</Text>
          </TouchableOpacity>

          {portraits.length > 0 && (
            <View style={styles.portraitList}>
              {portraits.slice(0, 5).map((p, i) => (
                <View key={p.id} style={styles.portraitRow}>
                  <Text style={styles.portraitDate}>
                    {p.created_at.split(' ')[0]}
                    {i === 0 ? '（最新）' : ''}
                  </Text>
                  <Text style={styles.portraitScores}>
                    自律 {p.discipline_score} · 投入 {p.engagement_score} · 拖延{' '}
                    {p.procrastination_score} · 坚持 {p.persistence_score}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tier Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分析范围</Text>
          <Text style={styles.sectionDesc}>解锁更长时间范围的反馈。</Text>
          <View style={styles.tierRow}>
            {TIERS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tierCard, tier === t.key && styles.tierCardSelected]}
                onPress={() => setTier(t.key)}
              >
                <Text style={[styles.tierLabel, tier === t.key && styles.tierLabelSelected]}>
                  {t.label}
                </Text>
                <Text style={[styles.tierDesc, tier === t.key && styles.tierDescSelected]}>
                  {t.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <Text style={styles.sectionDesc}>
            当前存储了 {factCount} 条事实记录。所有数据仅保存在本机。
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleExport}
            disabled={exporting}
          >
            <Text style={styles.actionBtnText}>
              {exporting ? '导出中...' : '导出所有数据 (JSON)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleImport} disabled={importing}>
            <Text style={styles.actionBtnText}>
              {importing ? '导入中...' : '导入数据 (JSON)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAll}>
            <Text style={styles.dangerBtnTextLarge}>删除所有本地数据</Text>
          </TouchableOpacity>
        </View>

        {/* 仅开发模式可见 —— 生产构建里整块不存在 */}
        {__DEV__ && (
          <View style={[styles.section, styles.devSection]}>
            <Text style={styles.sectionTitle}>开发工具</Text>
            <Text style={styles.sectionDesc}>
              仅在开发模式下显示，不会出现在正式版本中。
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSeedDemo}
              disabled={seeding}
            >
              <Text style={styles.actionBtnText}>
                {seeding ? '载入中...' : '载入 30 天演示数据'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐私承诺</Text>
          <View style={styles.privacyCard}>
            <Text style={styles.privacyItem}>不拥有你的数据</Text>
            <Text style={styles.privacyItem}>不读取其他 App</Text>
            <Text style={styles.privacyItem}>不截屏</Text>
            <Text style={styles.privacyItem}>不建立服务器保存你的隐私</Text>
            <Text style={styles.privacyItem}>你提交什么，App 才分析什么</Text>
          </View>
        </View>

        <Text style={styles.version}>Narrative Tracker v1.0.0 · Local-first · BYOK</Text>
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
