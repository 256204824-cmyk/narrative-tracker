import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FactLog } from '../types';

interface Props {
  fact: FactLog;
}

export default function FactCard({ fact }: Props) {
  const tags: string[] = (() => {
    try {
      return JSON.parse(fact.category_tags);
    } catch {
      return [];
    }
  })();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{fact.date}</Text>
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {fact.one_line_fact ? (
        <Text style={styles.oneLine}>"{fact.one_line_fact}"</Text>
      ) : null}
      {fact.completed_text ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>完成了</Text>
          <Text style={styles.sectionText}>{fact.completed_text}</Text>
        </View>
      ) : null}
      {fact.uncompleted_text ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>未完成</Text>
          <Text style={styles.sectionText}>{fact.uncompleted_text}</Text>
        </View>
      ) : null}
      {fact.progress_evidence ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>靠近目标</Text>
          <Text style={styles.sectionText}>{fact.progress_evidence}</Text>
        </View>
      ) : null}
      {fact.avoidance_text ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>逃避</Text>
          <Text style={styles.sectionText}>{fact.avoidance_text}</Text>
        </View>
      ) : null}
      {fact.representative_fact ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>最有代表性</Text>
          <Text style={styles.sectionText}>{fact.representative_fact}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
  },
  oneLine: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 22,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#a0a0b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
