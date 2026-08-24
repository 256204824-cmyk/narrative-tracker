import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FactCard from '../components/FactCard';
import { FACT_IDS, TAG_IDS, tagLabel, normalizeTag } from '../constants/questions';
import { useT } from '../i18n/useT';
import { useAppState } from '../store/AppContext';
import {
  saveFactLog,
  updateFactLog,
  deleteFactLog,
  getAllFactLogs,
  countFactsOnDate,
} from '../database';
import type { FactLog } from '../types';
import { notify, confirmDestructive } from '../utils/dialog';
import { today } from '../utils/date';

interface Props {
  onNavigateToFeedback: () => void;
}

export default function HomeScreen({ onNavigateToFeedback }: Props) {
  const t = useT();
  const { locale } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState<FactLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  /** 非空表示正在修改这一条，而不是新增 */
  const [editing, setEditing] = useState<FactLog | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  const loadFacts = useCallback(async () => {
    const [data, count] = await Promise.all([getAllFactLogs(), countFactsOnDate(today())]);
    setFacts(data);
    setTodayCount(count);
  }, []);

  // 用 useFocusEffect 而非 useEffect：Tab 切走后组件不卸载，
  // 只在挂载时读一次会让「设置页删了数据/载入了数据」之后这里仍显示旧内容。
  useFocusEffect(
    useCallback(() => {
      loadFacts();
    }, [loadFacts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFacts();
    setRefreshing(false);
  }, [loadFacts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({});
    setSelectedTags([]);
  };

  const openEdit = (fact: FactLog) => {
    setEditing(fact);
    setFormData({
      completed: fact.completed_text,
      uncompleted: fact.uncompleted_text,
      progress: fact.progress_evidence,
      avoidance: fact.avoidance_text,
      representative: fact.representative_fact,
      one_line: fact.one_line_fact,
    });
    try {
      const tags = JSON.parse(fact.category_tags);
      setSelectedTags(Array.isArray(tags) ? tags.map(normalizeTag) : []);
    } catch {
      setSelectedTags([]);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (saving) return; // 防连点写入两条
    const hasAnyField = Object.values(formData).some((v) => v.trim().length > 0);
    if (!hasAnyField) {
      notify(t.home.needOneFieldTitle, t.home.needOneFieldBody);
      return;
    }

    const payload = {
      completed_text: formData.completed || '',
      uncompleted_text: formData.uncompleted || '',
      progress_evidence: formData.progress || '',
      avoidance_text: formData.avoidance || '',
      representative_fact: formData.representative || '',
      one_line_fact: formData.one_line || '',
      category_tags: JSON.stringify(selectedTags),
    };

    setSaving(true);
    try {
      if (editing) {
        await updateFactLog(editing.id, payload);
      } else {
        await saveFactLog({ date: today(), ...payload });
      }
      const wasEditing = !!editing;
      closeForm();
      await loadFacts();
      if (wasEditing) notify(t.home.updated);
    } catch (err) {
      notify(t.home.saveFailed, t.common.retry);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await confirmDestructive(
      t.home.deleteEntryTitle,
      t.home.deleteEntryBody,
      t.common.delete
    );
    if (!ok) return;
    try {
      await deleteFactLog(editing.id);
      closeForm();
      await loadFacts();
      notify(t.common.deleted);
    } catch (err) {
      notify(t.home.saveFailed, t.common.retry);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* 用 FlatList 而不是 ScrollView + map：Pro 档位卖的是「最近 1 年」，
          365 张卡片全量渲染在低端机上会明显卡顿。
          表头传的是**元素**不是函数——传内联函数会让 React 每次都当成新组件类型，
          导致表单里的输入框每敲一个字就重挂载、焦点丢失。 */}
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        data={facts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <FactCard fact={item} onPress={() => openEdit(item)} />
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>{t.home.title}</Text>
            <Text style={styles.subtitle}>
              {facts.length > 0 ? t.home.counted(facts.length) : t.home.empty}
            </Text>

            {!showForm && (
              <>
                <TouchableOpacity
            accessibilityRole="button" style={styles.addBtn} onPress={() => setShowForm(true)}>
                  <Text style={styles.addBtnText}>{t.home.add}</Text>
                </TouchableOpacity>
                {todayCount > 0 && (
                  <Text style={styles.todayHint}>{t.home.alreadyLoggedToday(todayCount)}</Text>
                )}
              </>
            )}

            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editing
                    ? t.home.editTitle(editing.date)
                    : new Date().toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                </Text>

                {FACT_IDS.map((id) => (
                  <View key={id} style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t.questions.fact[id].q}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder={t.questions.fact[id].hint}
                      placeholderTextColor="#bbb"
                      multiline
                      value={formData[id] || ''}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, [id]: text }))}
                    />
                  </View>
                ))}

                <Text style={styles.fieldLabel}>{t.home.tagsLabel}</Text>
                <View style={styles.tagsContainer}>
                  {TAG_IDS.map((id) => (
                    <TouchableOpacity
            accessibilityRole="button"
                      key={id}
                      style={[styles.tagBtn, selectedTags.includes(id) && styles.tagBtnSelected]}
                      onPress={() => toggleTag(id)}
                    >
                      <Text
                        style={[
                          styles.tagBtnText,
                          selectedTags.includes(id) && styles.tagBtnTextSelected,
                        ]}
                      >
                        {tagLabel(id)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
            accessibilityRole="button" style={styles.cancelBtn} onPress={closeForm}>
                    <Text style={styles.cancelBtnText}>{t.common.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
            accessibilityRole="button"
                    style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    <Text style={styles.submitBtnText}>
                      {saving ? t.common.saving : t.home.submit}
                    </Text>
                  </TouchableOpacity>
                </View>

                {editing && (
                  <TouchableOpacity
            accessibilityRole="button" style={styles.deleteEntryBtn} onPress={handleDelete}>
                    <Text style={styles.deleteEntryText}>{t.home.deleteEntry}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {facts.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.home.historyTitle}</Text>
                <TouchableOpacity
            accessibilityRole="button" onPress={onNavigateToFeedback}>
                  <Text style={styles.analyzeLink}>{t.home.viewAnalysis}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8fc' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  todayHint: { fontSize: 12, color: '#94a3b8', lineHeight: 17, marginTop: -8, marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  deleteEntryBtn: { marginTop: 14, paddingVertical: 12, alignItems: 'center' },
  deleteEntryText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  addBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: { fontSize: 15, fontWeight: '600', color: '#4f46e5', marginBottom: 16, textAlign: 'center' },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#f8f8fc',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e8e8f0',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f5',
    borderWidth: 1,
    borderColor: '#e0e0ea',
  },
  tagBtnSelected: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  tagBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  tagBtnTextSelected: { color: '#4f46e5', fontWeight: '700' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e8e8f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#555', fontSize: 15, fontWeight: '600' },
  submitBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  analyzeLink: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
});
