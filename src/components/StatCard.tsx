import { StyleSheet, View } from 'react-native';

import { colors, radius, type } from '@/theme';
import { Txt } from './Txt';

interface Props {
  label: string;
  value: string;
  unit?: string;
}

// Light stat tile — black text on #F0F0F0.
export function StatCard({ label, value, unit }: Props) {
  return (
    <View style={styles.card}>
      <Txt variant="caption" color="rgba(0,0,0,0.45)" numberOfLines={1}>
        {label}
      </Txt>
      <View style={styles.valueRow}>
        <Txt style={[type.stat, styles.value]}>{value}</Txt>
      </View>
      {unit ? (
        <Txt variant="caption" color="rgba(0,0,0,0.55)" numberOfLines={1}>
          {unit}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    color: colors.cardText,
    fontSize: 28,
  },
});
