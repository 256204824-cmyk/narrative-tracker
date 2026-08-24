import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FactCard from '../components/FactCard';
import { FACT_LOG_QUESTIONS, CATEGORY_TAGS } from '../constants/questions';
import { saveFactLog, getAllFactLogs } from '../database';
import type { FactLog } from '../types';
import { today } from '../utils/date';

interface Props {
  onNavigateToFeedback: () => void;
}

export default function HomeScreen({ onNavigateToFeedback }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState<FactLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const loadFacts = useCallback(async () => {
    const data = await getAllFactLogs();
    setFacts(data);
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

  const handleSubmit = async () => {
    const hasAnyField = Object.values(formData).some((v) => v.trim().length > 0);
    if (!hasAnyField) {
      Alert.alert('请至少填写一项', '即使是简单的一句话也很重要。');
      return;
    }

    try {
      await saveFactLog({
        date: today(),
        completed_text: formData.completed || '',
        uncompleted_text: formData.uncompleted || '',
        progress_evidence: formData.progress || '',
        avoidance_text: formData.avoidance || '',
        representative_fact: formData.representative || '',
        one_line_fact: formData.one_line || '',
        category_tags: JSON.stringify(selectedTags),
      });
      setFormData({});
      setSelectedTags([]);
      setShowForm(false);
      await loadFacts();
    } catch (err) {
      Alert.alert('保存失败', '请重试');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>事实日志</Text>
        <Text style={styles.subtitle}>
          {facts.length > 0
            ? `已记录 ${facts.length} 条事实`
            : '记录你的真实行动，不评判，只观察。'}
        </Text>

        {!showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ 记录今天的事实</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </Text>

            {FACT_LOG_QUESTIONS.map((q) => (
              <View key={q.id} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{q.question}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={q.hint}
                  placeholderTextColor="#bbb"
                  multiline
                  value={formData[q.id] || ''}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, [q.id]: text }))}
                />
              </View>
            ))}

            <Text style={styles.fieldLabel}>分类标签（可选）</Text>
            <View style={styles.tagsContainer}>
              {CATEGORY_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagBtn, selectedTags.includes(tag) && styles.tagBtnSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagBtnText, selectedTags.includes(tag) && styles.tagBtnTextSelected]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowForm(false);
                  setFormData({});
                  setSelectedTags([]);
                }}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>保存事实</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {facts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>历史记录</Text>
              <TouchableOpacity onPress={onNavigateToFeedback}>
                <Text style={styles.analyzeLink}>查看分析</Text>
              </TouchableOpacity>
            </View>
            {facts.map((fact) => (
              <FactCard key={fact.id} fact={fact} />
            ))}
          </>
        )}
      </ScrollView>
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
