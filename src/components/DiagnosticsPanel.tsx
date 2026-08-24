import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { AnalysisFormatError } from '../services';
import { useT } from '../i18n/useT';
import { notify } from '../utils/dialog';

interface Props {
  error: AnalysisFormatError;
}

/**
 * AI 返回结构不符合预期时的诊断面板。
 *
 * 默认折叠——用户只想看报告，不想被一堆字段名淹没；
 * 但展开后必须能看到「哪个字段、期望什么、实际收到什么」和模型的原始返回，
 * 否则在真机上根本无从判断是模型的问题还是 App 的问题。
 */
export default function DiagnosticsPanel({ error }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const asText = () =>
    [
      `provider: ${error.baseUrl}`,
      `model: ${error.model}`,
      '',
      t.diagnostics.fieldsHeader,
      ...error.issues.map(
        (i) =>
          `- ${i.field} | ${t.diagnostics.colExpected}: ${i.expected} | ${t.diagnostics.colActual}: ${i.actual} | ${i.fatal ? t.diagnostics.fatalTag : t.diagnostics.recoveredTag}`
      ),
      '',
      t.diagnostics.rawHeader,
      error.raw || t.diagnostics.rawEmpty,
    ].join('\n');

  const copy = async () => {
    await Clipboard.setStringAsync(asText());
    notify(t.diagnostics.copied);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.toggle} onPress={() => setOpen(!open)}>
        <Text style={styles.toggleText}>
          {open ? t.diagnostics.hide : t.diagnostics.show}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>{t.diagnostics.fieldsHeader}</Text>
          {error.issues.map((issue, i) => (
            <View key={`${issue.field}-${i}`} style={styles.issue}>
              <View style={styles.issueHead}>
                <Text style={styles.field}>{issue.field}</Text>
                <Text style={[styles.tag, issue.fatal ? styles.tagFatal : styles.tagOk]}>
                  {issue.fatal ? t.diagnostics.fatalTag : t.diagnostics.recoveredTag}
                </Text>
              </View>
              <Text style={styles.kv}>
                <Text style={styles.k}>{t.diagnostics.colExpected}: </Text>
                {issue.expected}
              </Text>
              <Text style={styles.kv}>
                <Text style={styles.k}>{t.diagnostics.colActual}: </Text>
                {issue.actual}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionLabel}>{t.diagnostics.rawHeader}</Text>
          <ScrollView style={styles.rawBox} nestedScrollEnabled>
            <Text style={styles.raw} selectable>
              {error.raw || t.diagnostics.rawEmpty}
            </Text>
          </ScrollView>

          <Text style={styles.hint}>{t.diagnostics.providerHint(error.baseUrl, error.model)}</Text>

          <TouchableOpacity style={styles.copyBtn} onPress={copy}>
            <Text style={styles.copyText}>{t.diagnostics.copy}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const MONO = { fontFamily: 'Menlo' } as const;

const styles = StyleSheet.create({
  wrap: { marginTop: -4, marginBottom: 12 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toggleText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },
  chevron: { fontSize: 10, color: '#b91c1c' },
  body: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  issue: {
    borderLeftWidth: 2,
    borderLeftColor: '#fecaca',
    paddingLeft: 10,
    marginBottom: 12,
  },
  issueHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  field: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', ...MONO },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tagFatal: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  tagOk: { backgroundColor: '#f1f5f9', color: '#64748b' },
  kv: { fontSize: 12, color: '#444', lineHeight: 18, ...MONO },
  k: { color: '#999' },
  rawBox: {
    maxHeight: 220,
    backgroundColor: '#f8f8fc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  raw: { fontSize: 11, color: '#333', lineHeight: 16, ...MONO },
  hint: { fontSize: 12, color: '#777', lineHeight: 18, marginBottom: 12 },
  copyBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyText: { fontSize: 13, fontWeight: '600', color: '#475569' },
});
