import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RatingScale from '../components/RatingScale';
import { SELF_PORTRAIT_QUESTIONS } from '../constants/questions';
import { saveSelfPortrait } from '../database';
import { notify } from '../utils/dialog';
import type { SelfPortrait } from '../types';

// 题库 id ←→ 数据库列名。表结构是固定列，加题必须同步改 schema，
// 所以这里显式列出映射而不是靠约定拼字符串。
const SCALE_COLUMN = {
  discipline: 'discipline_score',
  engagement: 'engagement_score',
  procrastination: 'procrastination_score',
  persistence: 'persistence_score',
} as const;

const TEXT_COLUMN = {
  strength: 'strength_text',
  change: 'change_text',
  self_words: 'self_words',
} as const;

interface Props {
  /** 重评时传入上一版，用于预填 */
  initial?: SelfPortrait | null;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSaved: () => void;
  /** 重评时允许放弃；初次画像不传，用户必须完成 */
  onCancel?: () => void;
}

export default function SelfPortraitForm({
  initial,
  title,
  subtitle,
  submitLabel,
  onSaved,
  onCancel,
}: Props) {
  const scaleQuestions = SELF_PORTRAIT_QUESTIONS.filter((q) => q.type === 'scale');
  const textQuestions = SELF_PORTRAIT_QUESTIONS.filter((q) => q.type === 'text');

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      scaleQuestions.map((q) => {
        const col = SCALE_COLUMN[q.id as keyof typeof SCALE_COLUMN];
        return [q.id, initial && col ? initial[col] : 5];
      })
    )
  );

  // 用 id 索引的记录，而不是每个字段一条 useState —— 题库加题时不会静默失效
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      textQuestions.map((q) => {
        const col = TEXT_COLUMN[q.id as keyof typeof TEXT_COLUMN];
        return [q.id, initial && col ? initial[col] : ''];
      })
    )
  );

  const handleFinish = async () => {
    const missing = textQuestions.filter((q) => !(texts[q.id] ?? '').trim());
    if (missing.length > 0) {
      notify('请填写所有问题', '每个问题都能帮助 AI 更好地理解你。');
      return;
    }

    setSaving(true);
    try {
      await saveSelfPortrait({
        discipline_score: scores.discipline,
        engagement_score: scores.engagement,
        procrastination_score: scores.procrastination,
        persistence_score: scores.persistence,
        strength_text: texts.strength.trim(),
        change_text: texts.change.trim(),
        self_words: texts.self_words.trim(),
      });
      onSaved();
    } catch (err) {
      notify('保存失败', '请重试');
    } finally {
      setSaving(false);
    }
  };

  // ── 量表阶段 ──
  if (step < scaleQuestions.length) {
    const q = scaleQuestions[step];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.progress}>
            <Text style={styles.progressText}>
              {step + 1} / {scaleQuestions.length + 1}
            </Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.card}>
              <RatingScale
                label={q.question}
                value={scores[q.id] ?? 5}
                onChange={(v) => setScores((prev) => ({ ...prev, [q.id]: v }))}
              />
            </View>
          </View>
          <View style={styles.buttons}>
            {step > 0 ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(step - 1)}>
                <Text style={styles.btnSecondaryText}>上一题</Text>
              </TouchableOpacity>
            ) : onCancel ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
                <Text style={styles.btnSecondaryText}>取消</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep(step + 1)}>
              <Text style={styles.btnPrimaryText}>
                {step === scaleQuestions.length - 1 ? '继续填写' : '下一题'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── 文本阶段 ──
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progress}>
            <Text style={styles.progressText}>
              {scaleQuestions.length + 1} / {scaleQuestions.length + 1}
            </Text>
          </View>
          <Text style={styles.title}>再多了解你一点</Text>
          <Text style={styles.subtitle}>用你自己的话来描述自己。</Text>

          {textQuestions.map((q) => (
            <View key={q.id} style={styles.textCard}>
              <Text style={styles.questionLabel}>{q.question}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="写下你的真实想法..."
                placeholderTextColor="#bbb"
                multiline
                value={texts[q.id] ?? ''}
                onChangeText={(text) => setTexts((prev) => ({ ...prev, [q.id]: text }))}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btnSubmit, saving && styles.btnDisabled]}
            onPress={handleFinish}
            disabled={saving}
          >
            <Text style={styles.btnSubmitText}>{saving ? '保存中...' : submitLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnBack} onPress={() => setStep(scaleQuestions.length - 1)}>
            <Text style={styles.btnBackText}>返回上一题</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8fc' },
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  scroll: { flex: 1, backgroundColor: '#f8f8fc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  progress: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  progressText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnPrimary: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: '#e8e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#555', fontSize: 16, fontWeight: '600' },
  textCard: { marginBottom: 20 },
  questionLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e8e8f0',
    textAlignVertical: 'top',
  },
  btnSubmit: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.6 },
  btnSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnBack: { paddingVertical: 14, alignItems: 'center' },
  btnBackText: { color: '#888', fontSize: 14, fontWeight: '600' },
});
