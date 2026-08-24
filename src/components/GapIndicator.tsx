import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useT } from '../i18n/useT';

interface Props {
  alignmentScore: number;
  confidence: 'low' | 'medium' | 'high';
}

export default function GapIndicator({ alignmentScore, confidence }: Props) {
  const t = useT();
  // 兜底：分数若越界会把进度条宽度撑坏
  const score = Math.min(100, Math.max(0, Math.round(alignmentScore || 0)));

  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = () => {
    if (score >= 80) return t.feedback.highMatch;
    if (score >= 50) return t.feedback.partialMatch;
    return t.feedback.lowMatch;
  };

  const getConfidenceLabel = () => {
    switch (confidence) {
      case 'high': return t.feedback.confidenceHigh;
      case 'medium': return t.feedback.confidenceMedium;
      case 'low': return t.feedback.confidenceLow;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={styles.label}>{t.feedback.alignment}</Text>
        <Text style={[styles.score, { color: getColor() }]}>{score}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: getColor() }]} />
      </View>
      <View style={styles.meta}>
        <Text style={[styles.badge, { backgroundColor: getColor() + '20', color: getColor() }]}>
          {getLabel()}
        </Text>
        <Text style={styles.confidence}>{getConfidenceLabel()}</Text>
      </View>
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
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    backgroundColor: '#f0f0f5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  confidence: {
    fontSize: 12,
    color: '#999',
  },
});
