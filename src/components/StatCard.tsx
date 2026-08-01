import { StyleSheet, View } from 'react-native';

import { colors, spacing, type } from '@/theme';
import { GlassCard } from './GlassCard';
import { Txt } from './Txt';

interface StatItemProps {
  label: string;
  value: string;
  unit?: string;
}

function StatItem({ label, value, unit }: StatItemProps) {
  return (
    <View style={styles.item}>
      <Txt variant="caption" color={colors.textFaint} numberOfLines={1} center>
        {label}
      </Txt>
      <View style={styles.valueRow}>
        <Txt style={styles.value}>{value}</Txt>
        {unit ? (
          <Txt variant="caption" color={colors.textMuted} style={styles.unit}>
            {unit}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

interface Props {
  stats: StatItemProps[];
}

/** Three-up stat strip on dark glass — dividers between columns. */
export function StatCard({ stats }: Props) {
  return (
    <GlassCard style={styles.strip}>
      {stats.map((s, i) => (
        <View key={s.label} style={styles.cell}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <StatItem {...s} />
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    backgroundColor: colors.glassBorder,
    marginVertical: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
  },
  value: {
    ...type.stat,
    fontSize: 26,
    lineHeight: 28,
    color: colors.text,
  },
  unit: {
    fontSize: 11,
    lineHeight: 14,
  },
});
