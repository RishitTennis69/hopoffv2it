import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { getApp } from '@/data/apps';
import { colors, spacing } from '@/theme';
import type { BrandKey } from '@/store/types';
import { AppIcon } from './AppIcon';
import { HourWheel } from './HourWheel';
import { PillButton } from './PillButton';
import { PopupPanel } from './PopupPanel';
import { Txt } from './Txt';

interface Props {
  visible: boolean;
  onClose: () => void;
  appIds: string[];
  initialName?: string;
  initialLimit?: number;
  onSave: (name: string, limitHours: number) => void;
  onDelete?: () => void;
}

function centerLabels(hours: number) {
  if (hours < 1) return { big: `${Math.round(hours * 60)}`, small: 'Min' };
  if (Number.isInteger(hours)) return { big: `${hours}`, small: hours === 1 ? 'Hr' : 'Hrs' };
  return { big: `${hours}`, small: 'Hrs' };
}

export function GroupModal({
  visible,
  onClose,
  appIds,
  initialName,
  initialLimit,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [limit, setLimit] = useState(initialLimit ?? 0.5);

  const brands = appIds.map((id) => getApp(id)?.brand).filter(Boolean) as BrandKey[];
  const labels = centerLabels(limit);

  return (
    <PopupPanel visible={visible} onClose={onClose} variant="center">
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
          max={8}
          step={0.5}
          size={250}
          centerBig={labels.big}
          centerSmall={labels.small}
        />

        <PillButton
          label="Save Group"
          onPress={() => onSave(name.trim() || 'My group', limit)}
          style={{ alignSelf: 'stretch' }}
        />

        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={12}>
            <Txt variant="body" color={colors.danger} center>
              Delete group
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </PopupPanel>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Inter_800ExtraBold',
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
