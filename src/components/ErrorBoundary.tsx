import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { t } from '../i18n/catalog';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 兜底：任何组件渲染异常都会被这里接住。
 *
 * 没有它的话，一次未预料的 undefined 就让用户看到纯白屏幕，
 * 连「出错了」都没有，只能卸载重装——而这个 App 的数据全在本机，
 * 卸载就等于全丢。所以这里必须明说「你的记录还在」。
 *
 * 用 t()（模块级）而不是 useT()：class 组件用不了 hook，
 * 而且出错时能少依赖一层 context 就少一层。
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const m = t().crash;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{m.title}</Text>
        <Text style={styles.body}>{m.body}</Text>

        <TouchableOpacity style={styles.retry} onPress={() => this.setState({ error: null })}>
          <Text style={styles.retryText}>{m.retry}</Text>
        </TouchableOpacity>

        <Text style={styles.detailLabel}>{m.detail}</Text>
        <ScrollView style={styles.detailBox}>
          <Text style={styles.detail} selectable>
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fc', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  body: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 20 },
  retry: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 28,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 6 },
  detailBox: { maxHeight: 220, backgroundColor: '#fff', borderRadius: 10, padding: 12 },
  detail: { fontSize: 11, color: '#666', lineHeight: 16, fontFamily: 'Menlo' },
});
