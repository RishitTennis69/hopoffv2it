import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { getApp } from '@/data/apps';
import { colors, spacing } from '@/theme';
import type { BrandKey } from '@/store/types';
import { AppIcon } from './AppIcon';
import { HourWheel } from './HourWheel';
import { PillButton } from './PillButton';
import { PopupPanel } from './PopupPanel';

interface Props {
  visible: boolean;
  onClose: () => void;
  appIds: string[];
  initialName?: string;
  initialLimit?: number;
  initialSessionCount?: number;
  onSave: (name: string, limitHours: number, sessionCount: number, sessionLimitMinutes: number) => void;
}

function centerLabels(hours: number) {
  if (hours < 1) return { big: `${Math.round(hours * 60)}`, small: 'Min' };
  if (Number.isInteger(hours)) return { big: `${hours}`, small: hours === 1 ? 'Hr' : 'Hrs' };
  return { big: `${hours}`, small: 'Hrs' };
}

function GroupModalForm({
  appIds,
  initialName,
  initialLimit,
  initialSessionCount,
  onSave,
}: Omit<Props, 'visible' | 'onClose'>) {
  const [name, setName] = useState(initialName ?? '');
  const [limit, setLimit] = useState(initialLimit ?? 0.5);

  const brands = appIds.map((id) => getApp(id)?.brand).filter(Boolean) as BrandKey[];
  const labels = centerLabels(limit);
  const dailyMinutes = Math.max(1, Math.round(limit * 60));
  const sessionOptions = sessionCountOptions(dailyMinutes);
  const requestedSessionCount = Math.max(1, initialSessionCount ?? sessionOptions[0]);
  const sessionCount = sessionOptions.includes(requestedSessionCount) ? requestedSessionCount : sessionOptions[0];
  const sessionLimitMinutes = Math.round(dailyMinutes / sessionCount);

  return (
    <View style={styles.content}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name of your group"
        placeholderTextColor={colors.textFaint}
        style={styles.name}
      />

      {brands.length > 0 ? (
        <View style={styles.iconsRow}>
          {brands.map((brand, i) => (
            <AppIcon key={`${brand}-${i}`} brand={brand} size={36} />
          ))}
        </View>
      ) : null}

      <HourWheel
        value={limit}
        onChange={setLimit}
        min={0.5}
        max={3}
        step={0.5}
        size={250}
        centerBig={labels.big}
        centerSmall={labels.small}
      />

      <PillButton
        label="Save Group"
        onPress={() => onSave(name.trim(), limit, sessionCount, sessionLimitMinutes)}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}

export function GroupModal({
  visible,
  onClose,
  appIds,
  initialName,
  initialLimit,
  initialSessionCount,
  onSave,
}: Props) {
  const formKey = `${initialName ?? ''}:${initialLimit ?? 0.5}:${initialSessionCount ?? 3}:${appIds.join(',')}`;

  return (
    <PopupPanel visible={visible} onClose={onClose} variant="center">
      <GroupModalForm
        key={formKey}
        appIds={appIds}
        initialName={initialName}
        initialLimit={initialLimit}
        initialSessionCount={initialSessionCount}
        onSave={onSave}
      />
    </PopupPanel>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  name: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
    minWidth: 200,
    paddingVertical: spacing.sm,
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});

function sessionCountOptions(totalMinutes: number) {
  const options = [1, 2, 3, 4].filter((count) => {
    const minutes = totalMinutes / count;
    return Number.isInteger(minutes) && minutes >= 15 && minutes <= 45 && minutes % 5 === 0;
  });
  return options.length ? options : [1];
}
