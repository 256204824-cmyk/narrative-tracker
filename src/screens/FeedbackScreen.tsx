import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GapIndicator from '../components/GapIndicator';
import { requestAnalysis, AnalysisFormatError } from '../services';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import {
  getAllSelfPortraits,
  getFactLogsBetween,
  saveAnalysisResult,
  getAllAnalyses,
  deleteAnalysisResult,
} from '../database';
import { today, daysAgo, countDistinctDays } from '../utils/date';
import { TIER_LIMITS, MIN_DAYS_FOR_ANALYSIS } from '../constants/questions';
import type { AIAnalysisOutput, AnalysisResult, FactLog, SelfPortrait } from '../types';
import { useAppState } from '../store/AppContext';
import { useT } from '../i18n/useT';
import { confirmDestructive } from '../utils/dialog';

export default function FeedbackScreen() {
  const { tier } = useAppState();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<AnalysisFormatError | null>(null);
  const [result, setResult] = useState<AIAnalysisOutput | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<AnalysisResult[]>([]);
  const [factCount, setFactCount] = useState(0);
  const [recordedDays, setRecordedDays] = useState(0);

  const maxDays = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  const loadPrevious = useCallback(async () => {
    try {
      const analyses = await getAllAnalyses();
      setPreviousAnalyses(analyses);

      const facts = await getFactLogsBetween(daysAgo(maxDays - 1), today());
      setFactCount(facts.length);
      setRecordedDays(countDistinctDays(facts));
    } catch (err) {
      // 静默失败会让界面显示 0 条事实，用户无法区分「没数据」和「读取出错」
      setError(t.feedback.loadFailed);
    }
  }, [maxDays]);

  useFocusEffect(
    useCallback(() => {
      loadPrevious();
    }, [loadPrevious])
  );

  // 历史报告在库里是 JSON 字符串，点开时还原成渲染用的结构。
  const removeReport = async (a: AnalysisResult) => {
    const ok = await confirmDestructive(
      t.home.deleteReport,
      t.home.deleteReportBody,
      t.common.delete
    );
    if (!ok) return;
    await deleteAnalysisResult(a.id);
    if (result?.summary === a.summary) setResult(null);
    await loadPrevious();
  };

  const openSaved = (a: AnalysisResult) => {
    const parseList = <T,>(raw: string): T[] => {
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    };
    setError(null);
    setResult({
      summary: a.summary,
      alignment_score: a.alignment_score,
      confidence: a.confidence,
      matched_beliefs: parseList(a.matched_beliefs),
      gaps: parseList(a.gaps),
      insufficient_evidence: parseList(a.insufficient_evidence),
      suggested_reflection: a.suggested_reflection,
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setFormatError(null);
    setResult(null);

    try {
      // 全部画像版本：最新一版用于对比，更早的版本让模型看到叙事本身的变化
      const portraits = await getAllSelfPortraits();
      const portrait = portraits[0];
      if (!portrait) {
        setError(t.feedback.noPortrait);
        setLoading(false);
        return;
      }

      const since = daysAgo(maxDays - 1);
      const endDate = today();

      const facts: FactLog[] = await getFactLogsBetween(since, endDate);

      if (facts.length === 0) {
        setError(t.feedback.noFacts);
        setLoading(false);
        return;
      }

      // 按「不同的天数」而不是「条数」判断证据是否充足。
      // 同一天连写三条并不能说明任何跨时间的模式（PRD 5.2）。
      const distinctDays = countDistinctDays(facts);
      setRecordedDays(distinctDays);
      if (distinctDays < MIN_DAYS_FOR_ANALYSIS) {
        setError(
          t.feedback.needMoreDays(maxDays, distinctDays, MIN_DAYS_FOR_ANALYSIS - distinctDays)
        );
        setLoading(false);
        return;
      }

      const analysis = await requestAnalysis({
        portrait,
        history: portraits.slice(1, 6),
        facts,
        windowDays: maxDays,
      });

      setResult(analysis);

      await saveAnalysisResult({
        period_start: since,
        period_end: endDate,
        summary: analysis.summary,
        alignment_score: analysis.alignment_score,
        confidence: analysis.confidence,
        matched_beliefs: JSON.stringify(analysis.matched_beliefs),
        gaps: JSON.stringify(analysis.gaps),
        insufficient_evidence: JSON.stringify(analysis.insufficient_evidence),
        suggested_reflection: analysis.suggested_reflection,
      });

      await loadPrevious();
    } catch (err: any) {
      setError(err?.message || t.feedback.genericFailure);
      // 结构不符时把逐字段诊断留给界面展示，而不是只丢一句错误
      setFormatError(err instanceof AnalysisFormatError ? err : null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.feedback.title}</Text>
        <Text style={styles.subtitle}>
          {t.feedback.subtitle}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{t.feedback.windowValue(maxDays)}</Text>
            <Text style={styles.infoLabel}>{t.feedback.windowLabel}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{factCount}</Text>
            <Text style={styles.infoLabel}>{t.feedback.factsLabel}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{previousAnalyses.length}</Text>
            <Text style={styles.infoLabel}>{t.feedback.analysesLabel}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.analyzeBtnText}>{t.feedback.generate}</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {formatError && <DiagnosticsPanel error={formatError} />}

        {result && (
          <View style={styles.resultSection}>
            <GapIndicator
              alignmentScore={result.alignment_score}
              confidence={result.confidence}
              recordedDays={recordedDays}
              windowDays={maxDays}
            />

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>{t.feedback.summary}</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            {result.matched_beliefs.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t.feedback.matched}</Text>
                {result.matched_beliefs.map((item, i) => (
                  <View key={i} style={styles.beliefItem}>
                    <Text style={styles.beliefLabel}>"{item.belief}"</Text>
                    <Text style={styles.beliefEvidence}>{t.feedback.evidencePrefix(item.evidence)}</Text>
                    <Text style={styles.beliefAssessment}>{item.assessment}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.gaps.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t.feedback.gaps}</Text>
                {result.gaps.map((item, i) => (
                  <View key={i} style={styles.beliefItem}>
                    <Text style={styles.beliefLabel}>"{item.belief}"</Text>
                    <Text style={styles.beliefEvidence}>{t.feedback.evidencePrefix(item.evidence)}</Text>
                    <Text style={styles.beliefAssessment}>{item.assessment}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.insufficient_evidence.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t.feedback.insufficient}</Text>
                {result.insufficient_evidence.map((item, i) => (
                  <Text key={i} style={styles.insufficientItem}>- {item}</Text>
                ))}
              </View>
            )}

            {result.suggested_reflection ? (
              <View style={styles.reflectionCard}>
                <Text style={styles.sectionTitle}>{t.feedback.suggestion}</Text>
                <Text style={styles.reflectionText}>{result.suggested_reflection}</Text>
              </View>
            ) : null}
          </View>
        )}

        {previousAnalyses.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>{t.feedback.historyTitle}</Text>
            {previousAnalyses.slice(0, 10).map((a) => (
              <TouchableOpacity key={a.id} style={styles.historyCard} onPress={() => openSaved(a)}>
                <Text style={styles.historyPeriod}>
                  {a.period_start} ~ {a.period_end}
                </Text>
                <Text style={styles.historySummary} numberOfLines={2}>
                  {a.summary}
                </Text>
                <View style={styles.historyFooter}>
                  <Text style={styles.historyScore}>
                    {t.feedback.historyScore(a.alignment_score)}
                  </Text>
                  <Text style={styles.historyDelete} onPress={() => removeReport(a)}>
                    {t.home.deleteReport}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8fc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoValue: { fontSize: 22, fontWeight: '800', color: '#4f46e5' },
  infoLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  analyzeBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorCard: {
    backgroundColor: '#fff3f3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: { fontSize: 14, color: '#b91c1c', lineHeight: 20 },
  resultSection: { marginTop: 8 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: { fontSize: 15, color: '#333', lineHeight: 24 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  beliefItem: {
    backgroundColor: '#f8f8fc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  beliefLabel: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 4 },
  beliefEvidence: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 4 },
  beliefAssessment: { fontSize: 13, color: '#333', fontWeight: '600', lineHeight: 18 },
  insufficientItem: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
    marginBottom: 4,
  },
  reflectionCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reflectionText: { fontSize: 14, color: '#3730a3', lineHeight: 22 },
  historySection: { marginTop: 8 },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  historyPeriod: { fontSize: 12, color: '#999', marginBottom: 4 },
  historySummary: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 4 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  historyDelete: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  historyScore: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
});
