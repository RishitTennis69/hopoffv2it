import { Pressable, StyleSheet, View } from 'react-native';

import { getApp } from '@/data/apps';
import { formatLimit } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { AppGroup } from '@/store/types';
import { AppIcon } from './AppIcon';
import { GlassCard } from './GlassCard';
import { Txt } from './Txt';

interface Props {
  group: AppGroup;
  onPress?: () => void;
}

function StackedIcons({ appIds }: { appIds: string[] }) {
  const shown = appIds.slice(0, 3);
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((id, i) => {
        const app = getApp(id);
        if (!app) return null;
        return (
          <View
            key={id}
            style={{ marginLeft: i === 0 ? 0 : -12, borderRadius: 18, borderWidth: 2, borderColor: colors.bg }}>
            <AppIcon brand={app.brand} size={34} />
          </View>
        );
      })}
    </View>
  );
}

export function GroupCard({ group, onPress }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <GlassCard style={styles.row}>
        <View style={styles.left}>
          <StackedIcons appIds={group.appIds} />
          <Txt variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {group.name}
          </Txt>
        </View>
        <Txt variant="bodyStrong" color={colors.textMuted}>
          {formatLimit(group.limitHours)}
        </Txt>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
});
