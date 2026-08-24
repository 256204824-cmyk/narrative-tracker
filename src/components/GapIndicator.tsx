import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useT } from '../i18n/useT';
import { gapPresentation } from './gapPresentation';

interface Props {
  alignmentScore: number;
  confidence: 'low' | 'medium' | 'high';
  /** 窗口内有记录的天数 */
  recordedDays?: number;
  /** 分析窗口天数，用于判断记录是否稀疏 */
  windowDays?: number;
}

/**
 * 叙事-行为对齐度。
 *
 * **置信度必须调制呈现强度**，这是 PRD 5.2 的要求而不是装饰。
 * 低置信度时仍然打出红色「差距较大」和 28 号大字，视觉上传达的是判决，
 * 而不是校准——那正是原则四禁止的「证据不足时强行下结论」。
 *
 * 所以低置信度下：不上红色、分数缩小转灰、结论标签换成「记录还太少」，
 * 并明说还差多少。分数仍然显示（不隐藏信息），但不再被读成判决。
 */
export default function GapIndicator({ alignmentScore, confidence, recordedDays, windowDays }: Props) {
  const t = useT();
  const { score, tentative, tone, sparse } = gapPresentation(
    alignmentScore,
    confidence,
    recordedDays,
    windowDays
  );

  const color =
    tone === 'neutral' ? '#94a3b8' : tone === 'good' ? '#22c55e' : tone === 'warn' ? '#f59e0b' : '#ef4444';

  const label = tentative
    ? t.feedback.lowConfidenceLabel
    : tone === 'good'
      ? t.feedback.highMatch
      : tone === 'warn'
        ? t.feedback.partialMatch
        : t.feedback.lowMatch;

  const confidenceLabel =
    confidence === 'high'
      ? t.feedback.confidenceHigh
      : confidence === 'medium'
        ? t.feedback.confidenceMedium
        : t.feedback.confidenceLow;

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={styles.label}>{t.feedback.alignment}</Text>
        <Text style={[styles.score, tentative && styles.scoreTentative, { color }]}>{score}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.meta}>
        <Text style={[styles.badge, { backgroundColor: color + '20', color }]}>{label}</Text>
        <Text style={styles.confidence}>{confidenceLabel}</Text>
      </View>

      {tentative && (
        <Text style={styles.note}>
          {t.feedback.lowConfidenceNoteGeneric}
          {/* 低置信度不一定是天数少（也可能是主题分布极不均衡），
              只有记录确实稀疏时才提天数，否则「30 天里只有 30 天有记录」读起来很荒谬 */}
          {sparse ? ` ${t.feedback.lowConfidenceSparse(recordedDays!, windowDays!)}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  score: { fontSize: 28, fontWeight: '800' },
  // 低置信度时收掉字号和字重，不让分数被读成判决
  scoreTentative: { fontSize: 20, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: '#f0f0f5', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 1,
  },
  confidence: { fontSize: 12, color: '#999' },
  note: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
  },
});
