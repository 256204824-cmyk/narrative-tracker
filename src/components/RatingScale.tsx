import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function RatingScale({ value, onChange, label }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.dot, value >= n ? styles.dotFilled : styles.dotEmpty]}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dotText, value >= n ? styles.dotTextFilled : styles.dotTextEmpty]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.endLabel}>1 非常不符合</Text>
        <Text style={styles.endLabel}>10 非常符合</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotEmpty: {
    backgroundColor: '#f0f0f5',
    borderColor: '#d0d0dd',
  },
  dotFilled: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotTextEmpty: {
    color: '#888',
  },
  dotTextFilled: {
    color: '#fff',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  endLabel: {
    fontSize: 11,
    color: '#999',
  },
});
