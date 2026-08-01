import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Image } from 'expo-image';

import { getApp } from '@/data/apps';
import { refreshMonitorConfig } from '@/services/blockMonitor';
import { colors, spacing } from '@/theme';
import { useApps } from '@/store';
import type { BrandKey, LockInScheduleId, LockInScheduleRepeat } from '@/store/types';
import { AppIcon } from './AppIcon';
import { ConfirmModal } from './ConfirmModal';
import { HourWheel } from './HourWheel';
import { Icon, type IconName } from './Icon';
import { PillButton } from './PillButton';
import { Txt } from './Txt';

const MIN_LOCK_HOURS = 0.5;
const MAX_LOCK_HOURS = 3;
const LOCK_STEP_HOURS = 0.25;
const SCHEDULE_IDS: LockInScheduleId[] = ['morning', 'night', 'custom'];
const REPEAT_OPTIONS: { id: LockInScheduleRepeat; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
];
const SCHEDULE_META: Record<LockInScheduleId, { icon: IconName; image: string; subtitle: string }> = {
  morning: {
    icon: 'sunrise',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=72&w=700&auto=format&fit=crop',
    subtitle: 'Start clean before the feed gets loud.',
  },
  night: {
    icon: 'moon',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=72&w=700&auto=format&fit=crop',
    subtitle: 'Protect the wind-down window.',
  },
  custom: {
    icon: 'spark',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=72&w=700&auto=format&fit=crop',
    subtitle: 'Choose the exact hour you need.',
  },
};

const webFocusReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as ViewStyle) : null;

function formatRepeatLabel(repeat: LockInScheduleRepeat) {
  return repeat === 'weekends' ? 'Weekends' : repeat === 'weekdays' ? 'Weekdays' : 'Daily';
}

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatEndTime(baseMs: number, durationMinutes: number) {
  if (!baseMs) return '--:--';
  const date = new Date(baseMs + durationMinutes * 60_000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function centerLabels(hours: number) {
  const minutes = Math.round(hours * 60);
  if (minutes < 60) return { big: `${minutes}`, small: 'min' };
  if (minutes % 60 === 0) return { big: `${minutes / 60}`, small: minutes === 60 ? 'hr' : 'hrs' };
  return { big: `${(minutes / 60).toFixed(1)}`, small: 'hrs' };
}

function formatMinuteOfDay(minute: number) {
  const normalized = ((Math.round(minute) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function minuteToDate(minute: number) {
  const normalized = ((Math.round(minute) % 1440) + 1440) % 1440;
  const date = new Date();
  date.setHours(Math.floor(normalized / 60), normalized % 60, 0, 0);
  return date;
}

function dateToMinute(date: Date) {
  const minute = date.getHours() * 60 + Math.round(date.getMinutes() / 5) * 5;
  return ((minute % 1440) + 1440) % 1440;
}

function TimeRow({
  label,
  minute,
  active,
  onPress,
  onNudge,
}: {
  label: string;
  minute: number;
  active: boolean;
  onPress: () => void;
  onNudge: (delta: number) => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeRow,
        label === 'Start' && styles.timeRowDivider,
        active && styles.timeRowActive,
        pressed && styles.pressed,
      ]}>
      <View style={styles.timeRowCopy}>
        <Txt variant="caption" color={colors.textMuted}>
          {label.toUpperCase()}
        </Txt>
        <Txt style={styles.timeRowValue}>{formatMinuteOfDay(minute)}</Txt>
      </View>
      {Platform.OS === 'web' ? (
        <View style={styles.timeNudges}>
          <Pressable onPress={() => onNudge(-15)} hitSlop={8} style={styles.timeNudge}>
            <Txt variant="caption">-15</Txt>
          </Pressable>
          <Pressable onPress={() => onNudge(15)} hitSlop={8} style={styles.timeNudge}>
            <Txt variant="caption">+15</Txt>
          </Pressable>
        </View>
      ) : (
        <View style={styles.groupEdit}>
          <Icon name="edit" size={13} color={colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

function NativeSchedulePicker({
  minute,
  onChange,
  onDismiss,
}: {
  minute: number;
  onChange: (minute: number) => void;
  onDismiss: () => void;
}) {
  if (Platform.OS === 'web') return null;
  return (
    <View style={Platform.OS === 'ios' ? styles.nativePickerInline : styles.nativePickerDialog}>
      <DateTimePicker
        value={minuteToDate(minute)}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
        themeVariant="light"
        accentColor={colors.black}
        positiveButton={{ label: 'Set time' }}
        negativeButton={{ label: 'Cancel' }}
        onDismiss={onDismiss}
        onValueChange={(_, date) => {
          onChange(dateToMinute(date));
          if (Platform.OS === 'android') onDismiss();
        }}
      />
      {Platform.OS === 'ios' ? (
        <Pressable onPress={onDismiss} style={styles.nativePickerDone}>
          <Txt variant="caption" color={colors.white}>
            Done
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
export function LockInPanel() {
  const groups = useApps((s) => s.groups);
  const lockInGroupIds = useApps((s) => s.lockInGroupIds);
  const lockInGroupIdsConfigured = useApps((s) => s.lockInGroupIdsConfigured);
  const setLockInGroupIds = useApps((s) => s.setLockInGroupIds);
  const lockInUntil = useApps((s) => s.lockInUntil);
  const startLockIn = useApps((s) => s.startLockIn);
  const stopLockIn = useApps((s) => s.stopLockIn);
  const schedules = useApps((s) => s.lockInSchedules);
  const updateLockInSchedule = useApps((s) => s.updateLockInSchedule);
  const [now, setNow] = useState(0);
  const [startedForMs, setStartedForMs] = useState(45 * 60_000);
  const [selectedHours, setSelectedHours] = useState(0.75);
  const [selectedScheduleId, setSelectedScheduleId] = useState<LockInScheduleId | null>(null);
  const [editingTime, setEditingTime] = useState<{ scheduleId: LockInScheduleId; field: 'startMinute' | 'endMinute' } | null>(null);
  const [confirmEnding, setConfirmEnding] = useState(false);
  const [scheduleEnabledOverrides, setScheduleEnabledOverrides] = useState<Partial<Record<LockInScheduleId, boolean>>>({});

  useEffect(() => {
    const interval = setInterval(() => setNow(+new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Object.values(SCHEDULE_META).forEach((meta) => Image.prefetch(meta.image).catch(() => {}));
  }, []);

  const hasGroups = groups.length > 0;
  const effectiveLockInGroupIds = lockInGroupIdsConfigured ? lockInGroupIds : groups.map((group) => group.id);
  const active = !!lockInUntil && lockInUntil > now;
  const selectedMinutes = Math.round(selectedHours * 60);
  const remainingMs = active ? Math.max(0, (lockInUntil ?? 0) - now) : selectedMinutes * 60_000;
  const activeDurationMinutes = Math.round(startedForMs / 60_000);
  const activeStartMs = active && lockInUntil ? lockInUntil - startedForMs : 0;
  const wheelValue = active
    ? Math.max(MIN_LOCK_HOURS, Math.min(MAX_LOCK_HOURS, remainingMs / 3_600_000))
    : selectedHours;
  const labels = active ? { big: formatClock(remainingMs), small: `until ${formatEndTime(activeStartMs, activeDurationMinutes)}` } : centerLabels(selectedHours);

  const blockedBrands: BrandKey[] = useMemo(() => {
    const brands: BrandKey[] = [];
    const selected = new Set(effectiveLockInGroupIds);
    for (const group of groups) {
      if (!selected.has(group.id)) continue;
      for (const appId of group.appIds) {
        const brand = getApp(appId)?.brand;
        if (brand && !brands.includes(brand)) brands.push(brand);
      }
    }
    return brands;
  }, [effectiveLockInGroupIds, groups]);
  const selectedGroupNames = useMemo(
    () =>
      groups
        .filter((group) => effectiveLockInGroupIds.includes(group.id))
        .map((group) => group.name),
    [effectiveLockInGroupIds, groups],
  );
  const blockedAppIds = useMemo(
    () =>
      groups
        .filter((group) => effectiveLockInGroupIds.includes(group.id))
        .flatMap((group) => group.appIds)
        .slice(0, 4),
    [effectiveLockInGroupIds, groups],
  );
  const visibleSchedules = schedules.filter((schedule) => SCHEDULE_IDS.includes(schedule.id));
  const selectedSchedule = visibleSchedules.find((schedule) => schedule.id === selectedScheduleId);
  const selectedScheduleEnabled = selectedSchedule
    ? (scheduleEnabledOverrides[selectedSchedule.id] ?? selectedSchedule.enabled)
    : false;
  const sync = () => {
    refreshMonitorConfig().catch(() => {});
  };

  const toggleLockInGroup = (groupId: string) => {
    const current = lockInGroupIdsConfigured ? lockInGroupIds : groups.map((group) => group.id);
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];
    setLockInGroupIds(next);
    sync();
  };

  const begin = () => {
    const minutes = selectedMinutes;
    const nowMs = +new Date();
    setStartedForMs(minutes * 60_000);
    startLockIn(minutes);
    setNow(nowMs);
    sync();
  };

  const stop = () => {
    stopLockIn();
    setNow(+new Date());
    sync();
  };

  const updateScheduleAndSync = (
    id: LockInScheduleId,
    patch: Parameters<typeof updateLockInSchedule>[1],
  ) => {
    updateLockInSchedule(id, patch);
    sync();
  };

  const nudgeScheduleMinute = (id: LockInScheduleId, field: 'startMinute' | 'endMinute', currentMinute: number, delta: number) => {
    updateScheduleAndSync(id, { [field]: (((currentMinute + delta) % 1440) + 1440) % 1440 });
  };

  const setScheduleEnabledAndSync = (id: LockInScheduleId, enabled: boolean) => {
    setScheduleEnabledOverrides((prev) => ({ ...prev, [id]: enabled }));
    updateLockInSchedule(id, { enabled });
    sync();
  };

  return (
    <View style={styles.card}>
      <HourWheel
        value={wheelValue}
        onChange={(hours) => {
          if (!active) setSelectedHours(hours);
        }}
        min={MIN_LOCK_HOURS}
        max={MAX_LOCK_HOURS}
        step={LOCK_STEP_HOURS}
        size={310}
        centerBig={labels.big}
        centerSmall={labels.small}
      />

      {groups.length > 1 ? (
        <View style={styles.groupPicker}>
          <View style={styles.groupCards}>
            {groups.map((group) => {
              const selected = effectiveLockInGroupIds.includes(group.id);
              const brands = group.appIds
                .map((appId) => getApp(appId)?.brand)
                .filter(Boolean)
                .slice(0, 1) as BrandKey[];
              return (
                <Pressable
                  key={group.id}
                  onPress={() => toggleLockInGroup(group.id)}
                  style={[styles.groupCard, selected && styles.groupCardActive]}>
                  <View style={styles.groupLeft}>
                    <Txt variant="bodyStrong" color={colors.text} numberOfLines={1} style={styles.groupName}>
                      {group.name}
                    </Txt>
                    <View style={styles.groupIconStack}>
                      {brands.map((brand, index) => (
                        <View key={`${brand}-${index}`} style={[styles.groupMiniIcon, { left: index * 16 }]}>
                          <AppIcon brand={brand} size={28} />
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {hasGroups && selectedGroupNames.length > 0 ? (
        <View style={styles.blockingStatus}>
          <View style={styles.blockingIconStack}>
            {blockedAppIds.map((appId, index) => {
              const brand = getApp(appId)?.brand;
              if (!brand) return null;
              return (
                <View key={`${appId}-${index}`} style={[styles.blockingIcon, { left: index * 22 }]}>
                  <AppIcon brand={brand} size={36} />
                </View>
              );
            })}
          </View>
          <View style={styles.blockingCopy}>
            <Txt variant="caption" color={colors.textMuted}>
              BLOCKING
            </Txt>
            <Txt variant="bodyStrong" color={colors.text} numberOfLines={1}>
              {selectedGroupNames.join(', ')}
            </Txt>
          </View>
        </View>
      ) : null}

      {active ? (
        <Pressable onPress={() => setConfirmEnding(true)} style={styles.stopButton}>
          <Txt variant="button" color={colors.white} center>
            End Lock In
          </Txt>
        </Pressable>
      ) : (
        <PillButton label="Lock In" disabled={!hasGroups || effectiveLockInGroupIds.length === 0} onPress={begin} style={styles.lockButton} />
      )}

      {!hasGroups ? (
        <Txt variant="caption" color={colors.textFaint} center>
          Create a limit group first so HopOff knows what to block.
        </Txt>
      ) : blockedBrands.length === 0 ? (
        <Txt variant="caption" color={colors.textFaint} center>
          Pick at least one group to block.
        </Txt>
      ) : null}

      <View style={styles.scheduled}>
          <View style={styles.sectionHeader}>
            <Txt style={styles.scheduleHeaderTitle}>Schedules</Txt>
            {selectedSchedule ? (
              <Txt variant="caption" color={colors.textMuted}>
                {selectedScheduleEnabled ? 'Scheduled - ' : ''}
                {formatMinuteOfDay(selectedSchedule.startMinute)} - {formatMinuteOfDay(selectedSchedule.endMinute)}
              </Txt>
            ) : null}
          </View>

          <View style={styles.scheduleCards}>
            {visibleSchedules.map((schedule) => {
              const meta = SCHEDULE_META[schedule.id];
              const selected = schedule.id === selectedSchedule?.id;
              const enabled = schedule.id === selectedScheduleId
                ? selectedScheduleEnabled
                : (scheduleEnabledOverrides[schedule.id] ?? schedule.enabled);
              const repeat = schedule.repeat ?? 'daily';
              const repeatLabel = formatRepeatLabel(repeat);
              return (
                <Pressable
                  key={`${schedule.id}-${enabled ? 'on' : 'off'}`}
                  onPress={() => setSelectedScheduleId(schedule.id)}
                  style={({ pressed }) => [
                    webFocusReset,
                    styles.scheduleCard,
                    selected && styles.scheduleCardSelected,
                    enabled && styles.scheduleCardEnabled,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.scheduleImage}>
                    <Image source={{ uri: meta.image }} contentFit="cover" cachePolicy="disk" style={StyleSheet.absoluteFill} />
                    <View style={[styles.scheduleShade, enabled && styles.scheduleShadeEnabled]} />
                    <View style={styles.scheduleContent}>
                      {enabled ? <View pointerEvents="none" style={styles.scheduleEnabledRing} /> : null}
                      {enabled ? <View pointerEvents="none" style={styles.scheduleEnabledRail} /> : null}
                      <View style={[styles.scheduleIcon, selected && styles.scheduleIconSelected]}>
                        <Icon name={meta.icon} size={18} color={selected ? colors.black : colors.white} />
                      </View>
                      <View style={styles.scheduleText}>
                        <Txt variant="button" color={colors.white} numberOfLines={1} adjustsFontSizeToFit>
                          {schedule.label}
                        </Txt>
                        <Txt variant="caption" color="rgba(255,255,255,0.76)" numberOfLines={2} adjustsFontSizeToFit>
                          {formatMinuteOfDay(schedule.startMinute)} - {formatMinuteOfDay(schedule.endMinute)}
                          {'\n'}
                          {enabled ? `Scheduled - ${repeatLabel}` : repeatLabel}
                        </Txt>
                      </View>
                      {enabled ? (
                        <View style={styles.scheduleEnabledBadge}>
                          <Icon name="check" size={12} color={colors.black} />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedSchedule ? (
          <View style={[styles.clockCard, selectedScheduleEnabled && styles.clockCardActive]}>
            <View style={styles.timePanelRow}>
              <TimeRow
                label="Start"
                minute={selectedSchedule.startMinute}
                active={editingTime?.scheduleId === selectedSchedule.id && editingTime.field === 'startMinute'}
                onPress={() => setEditingTime({ scheduleId: selectedSchedule.id, field: 'startMinute' })}
                onNudge={(delta) => nudgeScheduleMinute(selectedSchedule.id, 'startMinute', selectedSchedule.startMinute, delta)}
              />
              <TimeRow
                label="End"
                minute={selectedSchedule.endMinute}
                active={editingTime?.scheduleId === selectedSchedule.id && editingTime.field === 'endMinute'}
                onPress={() => setEditingTime({ scheduleId: selectedSchedule.id, field: 'endMinute' })}
                onNudge={(delta) => nudgeScheduleMinute(selectedSchedule.id, 'endMinute', selectedSchedule.endMinute, delta)}
              />
            </View>
            {editingTime?.scheduleId === selectedSchedule.id ? (
              <NativeSchedulePicker
                minute={selectedSchedule[editingTime.field]}
                onChange={(minute) => updateScheduleAndSync(selectedSchedule.id, { [editingTime.field]: minute })}
                onDismiss={() => setEditingTime(null)}
              />
            ) : null}
            <View style={styles.repeatRow}>
              {REPEAT_OPTIONS.map((option) => {
                const activeRepeat = (selectedSchedule.repeat ?? 'daily') === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => updateScheduleAndSync(selectedSchedule.id, { repeat: option.id })}
                    style={[styles.repeatPill, activeRepeat && styles.repeatPillActive]}>
                    <Txt variant="caption" color={activeRepeat ? colors.white : colors.textMuted}>
                      {option.label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setScheduleEnabledAndSync(selectedSchedule.id, !selectedScheduleEnabled)}
              style={({ pressed }) => [
                webFocusReset,
                styles.scheduleButton,
                pressed && styles.pressed,
              ]}>
              <Txt variant="button" color={colors.white} center>
                {`Turn ${selectedSchedule.label} Lock-In ${selectedScheduleEnabled ? 'Off' : 'On'}`}
              </Txt>
            </Pressable>
          </View>
          ) : null}
        </View>

      <ConfirmModal
        visible={confirmEnding}
        title="End lock in?"
        message="Are you sure you want to stop this Lock In session early?"
        confirmLabel="End Lock In"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmEnding(false);
          stop();
        }}
        onCancel={() => setConfirmEnding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  groupPicker: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  groupCards: {
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  groupCard: {
    minHeight: 52,
    width: 230,
    maxWidth: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  groupCardActive: {
    borderColor: colors.black,
    backgroundColor: colors.surface,
  },
  groupIconStack: {
    width: 32,
    height: 30,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  groupMiniIcon: {
    position: 'absolute',
    top: 0,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  groupEdit: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButton: {
    alignSelf: 'stretch',
    minHeight: 56,
  },
  stopButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.dark,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockingStatus: {
    alignSelf: 'center',
    minHeight: 60,
    maxWidth: '100%',
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  blockingIconStack: {
    width: 104,
    height: 42,
    position: 'relative',
  },
  blockingIcon: {
    position: 'absolute',
    top: 3,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  blockingCopy: {
    minWidth: 0,
    maxWidth: 190,
    gap: 1,
  },
  scheduled: {
    alignSelf: 'stretch',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleHeaderTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 29,
    color: colors.text,
  },
  scheduleCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scheduleCard: {
    flex: 1,
    minHeight: 98,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  scheduleCardSelected: {
    borderColor: colors.black,
    borderWidth: 2,
    shadowColor: colors.black,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  scheduleCardEnabled: {
    borderColor: 'rgba(255,255,255,0.92)',
  },
  scheduleImage: {
    flex: 1,
  },
  scheduleShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scheduleShadeEnabled: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  scheduleContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  scheduleEnabledRing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  scheduleEnabledRail: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    bottom: spacing.md,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.white,
  },
  scheduleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleIconSelected: {
    backgroundColor: colors.white,
  },
  scheduleText: {
    gap: 2,
  },
  scheduleEnabledBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.16)',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  clockCardActive: {
  },
  scheduleStatusPill: {
    alignSelf: 'stretch',
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  scheduleStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.black,
  },
  clockCopy: {
    alignSelf: 'stretch',
    gap: 4,
  },
  timePanelRow: {
    alignSelf: 'stretch',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  timeRow: {
    alignSelf: 'stretch',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorder,
  },
  timeRowActive: {
    backgroundColor: colors.surfaceAlt,
  },
  timeRowCopy: {
    gap: 2,
  },
  timeRowValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    lineHeight: 33,
    color: colors.text,
  },
  timeNudges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeNudge: {
    minWidth: 40,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  nativePickerInline: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  nativePickerDialog: {
    width: 1,
    height: 1,
  },
  nativePickerDone: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 0,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    padding: 4,
  },
  repeatPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  scheduleButton: {
    alignSelf: 'stretch',
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: colors.black,
    borderColor: colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.88,
  },
});
