import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { getApp } from '@/data/apps';
import { formatLimit } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { AppGroup } from '@/store/types';
import { AppIcon } from './AppIcon';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  group: AppGroup;
  onPress?: () => void;
  onDelete?: () => void;
  onSessionCountChange?: (count: number) => void;
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
            style={{ marginLeft: i === 0 ? 0 : -12, borderRadius: 18, borderWidth: 2, borderColor: colors.surface }}>
            <AppIcon brand={app.brand} size={34} />
          </View>
        );
      })}
    </View>
  );
}

function sessionCountOptions(totalMinutes: number) {
  const roundedTotal = Math.round(totalMinutes);
  const options = [1, 2, 3, 4].filter((count) => {
    const minutes = roundedTotal / count;
    return Number.isInteger(minutes) && minutes >= 15 && minutes <= 45 && minutes % 5 === 0;
  });
  return options.length ? options : [1];
}

export function GroupCard({ group, onPress, onDelete, onSessionCountChange }: Props) {
  const totalMinutes = Math.round(group.limitHours * 60);
  const sessionOptions = sessionCountOptions(totalMinutes);
  const storedSessionCount = group.sessionCount && group.sessionCount > 0 ? group.sessionCount : sessionOptions[0];
  const sessionCount = sessionOptions.includes(storedSessionCount) ? storedSessionCount : sessionOptions[0];
  const sessionMinutes = Math.round(totalMinutes / sessionCount);

  const confirmDelete = () => {
    Alert.alert('Delete group?', `Remove "${group.name}" and ungroup its apps.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <GlassCard style={styles.row}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.main, pressed && onPress && styles.mainPressed]}>
        <View style={styles.topLine}>
          <View style={styles.left}>
            <StackedIcons appIds={group.appIds} />
            <Txt variant="bodyStrong" numberOfLines={2} style={styles.groupName}>
              {group.name}
            </Txt>
          </View>
          <Txt variant="bodyStrong" color={colors.textMuted} style={styles.limitLabel}>
            {formatLimit(group.limitHours)}
          </Txt>
        </View>
        {onSessionCountChange ? (
          <View style={styles.sessionLine}>
            <Txt variant="caption" color={colors.textFaint} style={styles.sessionHint}>
              {sessionMinutes}m each
            </Txt>
            <View style={styles.sessionToggle}>
              {sessionOptions.map((count) => (
                <Pressable
                  key={count}
                  onPress={() => onSessionCountChange(count)}
                  hitSlop={6}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sessionCount === count }}
                  accessibilityLabel={`${count} sessions`}
                  style={[styles.sessionButton, sessionCount === count && styles.sessionButtonActive]}>
                  <Txt
                    variant="caption"
                    color={sessionCount === count ? colors.white : colors.textMuted}
                    style={styles.sessionButtonText}>
                    {count}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </Pressable>

      {onDelete ? (
        <Pressable onPress={confirmDelete} hitSlop={8} style={({ pressed }) => [styles.trashBtn, pressed && styles.trashPressed]}>
          <Icon name="trash" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: spacing.sm,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 66,
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    gap: spacing.xs,
    borderRadius: 18,
    minWidth: 0,
  },
  mainPressed: {
    backgroundColor: colors.pressFill,
    transform: [{ scale: 0.99 }],
  },
  limitLabel: {
    textAlign: 'right',
    flexShrink: 0,
  },
  sessionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingLeft: 46,
  },
  sessionHint: {
    flexShrink: 0,
  },
  sessionToggle: {
    flexDirection: 'row',
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  sessionButton: {
    minWidth: 30,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  sessionButtonActive: {
    backgroundColor: colors.black,
  },
  sessionButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    lineHeight: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  groupName: {
    flex: 1,
    minWidth: 0,
    lineHeight: 22,
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashPressed: {
    backgroundColor: colors.pressFill,
    transform: [{ scale: 0.96 }],
  },
});
