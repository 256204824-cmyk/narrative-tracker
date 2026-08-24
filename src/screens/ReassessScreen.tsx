import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import SelfPortraitForm from './SelfPortraitForm';
import { getLatestSelfPortrait } from '../database';
import { notify } from '../utils/dialog';
import type { SelfPortrait } from '../types';

interface Props {
  onDone: () => void;
}

/**
 * 重新评价自我画像（PRD 4.1）。
 *
 * 每次保存都是 INSERT 新行而非更新，历史版本全部保留 ——
 * 「自我叙事随时间如何变化」正是这个产品的纵向价值，
 * 只留最新一版等于把它丢掉。
 */
export default function ReassessScreen({ onDone }: Props) {
  const [latest, setLatest] = useState<SelfPortrait | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLatest(await getLatestSelfPortrait());
      } catch {
        // 读不到上一版就当作空白重填，不阻断流程
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SelfPortraitForm
      initial={latest}
      title="重新评价自己"
      subtitle="按你现在的感受回答，不用参考上一次。"
      submitLabel="保存这一版画像"
      onSaved={() => {
        notify('已保存', '这一版画像已记录，上一版仍然保留。');
        onDone();
      }}
      onCancel={onDone}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8fc' },
});
