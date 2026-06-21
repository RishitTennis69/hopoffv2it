import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { APP_CATALOG, featureBlockHint } from '@/data/apps';
import { refreshMonitorConfig } from '@/services/blockMonitor';
import { getInstalledApps } from '@/services/nativeUsage';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme';
import { useApps } from '@/store';
import type { AppGroup, TrackedApp } from '@/store/types';
import { AppIcon } from './AppIcon';
import { GroupCard } from './GroupCard';
import { GroupModal } from './GroupModal';
import { Icon } from './Icon';
import { PillButton } from './PillButton';
import { SelectRow } from './SelectRow';
import { Txt } from './Txt';

function AddChip({ app, onPress }: { app: TrackedApp; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <AppIcon brand={app.brand} size={22} />
      <Txt variant="caption" color={colors.text}>
        {app.name}
      </Txt>
      <Icon name="plus" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

export function AppsManager() {
  const selectedIds = useApps((s) => s.selectedIds);
  const groups = useApps((s) => s.groups);
  const toggleSelect = useApps((s) => s.toggleSelect);
  const setSelected = useApps((s) => s.setSelected);
  const createGroup = useApps((s) => s.createGroup);
  const updateGroup = useApps((s) => s.updateGroup);
  const deleteGroup = useApps((s) => s.deleteGroup);

  const [installed, setInstalled] = useState<TrackedApp[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createIds, setCreateIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<AppGroup | null>(null);

  useEffect(() => {
    getInstalledApps().then(setInstalled);
  }, []);

  const groupedIds = useMemo(() => new Set(groups.flatMap((g) => g.appIds)), [groups]);
  const ungroupedSelected = selectedIds.filter((id) => !groupedIds.has(id));

  const hasGroups = groups.length > 0;
  const listApps = installed.filter((a) => !groupedIds.has(a.id));

  const allSelected = listApps.length > 0 && listApps.every((a) => selectedIds.includes(a.id));

  const toggleSelectAll = () => {
    haptics.selection();
    if (allSelected) {
      setSelected(selectedIds.filter((id) => !listApps.some((a) => a.id === id)));
    } else {
      setSelected(Array.from(new Set([...selectedIds, ...listApps.map((a) => a.id)])));
    }
  };

  const remainingCatalog = APP_CATALOG.filter(
    (a) => !selectedIds.includes(a.id) && !installed.some((i) => i.id === a.id),
  );

  const openCreate = () => {
    setCreateIds(ungroupedSelected);
    setCreateOpen(true);
  };

  return (
    <View style={{ gap: spacing.xxl }}>
      {/* Add more chips (once a group exists) */}
      {hasGroups && remainingCatalog.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.addMoreHead}>
            <Txt variant="caption" color={colors.textMuted}>
              ADD MORE
            </Txt>
            <Icon name="arrowRight" size={14} color={colors.textMuted} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {remainingCatalog.map((a) => (
              <AddChip key={a.id} app={a} onPress={() => toggleSelect(a.id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Create group */}
      <PillButton
        label="Create Group"
        variant="dark"
        disabled={ungroupedSelected.length < 2}
        onPress={openCreate}
      />

      {/* Groups */}
      {hasGroups ? (
        <View style={{ gap: spacing.md }}>
          <Txt variant="caption" color={colors.textMuted}>
            GROUPS
          </Txt>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} onPress={() => setEditing(g)} />
          ))}
        </View>
      ) : null}

      {/* App picker */}
      <View style={{ gap: spacing.lg }}>
        <View style={styles.listHead}>
          <Txt variant="caption" color={colors.textMuted}>
            {hasGroups ? 'YOUR APPS' : 'INSTALLED ON YOUR PHONE'}
          </Txt>
          {listApps.length > 0 ? (
            <Pressable onPress={toggleSelectAll} hitSlop={8}>
              <Txt variant="caption" color={colors.text}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Txt>
            </Pressable>
          ) : null}
        </View>

        {listApps.map((a) => (
          <SelectRow
            key={a.id}
            label={a.name}
            subtitle={featureBlockHint(a)}
            selected={selectedIds.includes(a.id)}
            onPress={() => toggleSelect(a.id)}
            left={<AppIcon brand={a.brand} size={36} />}
            checkStyle="circle"
          />
        ))}
      </View>

      {/* Create modal */}
      <GroupModal
        key={`create-${createOpen}`}
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        appIds={createIds}
        onSave={(name, limit) => {
          createGroup(name, createIds, limit);
          refreshMonitorConfig().catch(() => {});
          setCreateOpen(false);
        }}
      />

      {/* Edit modal */}
      <GroupModal
        key={`edit-${editing?.id ?? 'none'}`}
        visible={!!editing}
        onClose={() => setEditing(null)}
        appIds={editing?.appIds ?? []}
        initialName={editing?.name}
        initialLimit={editing?.limitHours}
        onSave={(name, limit) => {
          if (editing) updateGroup(editing.id, { name, limitHours: limit });
          refreshMonitorConfig().catch(() => {});
          setEditing(null);
        }}
        onDelete={
          editing
            ? () => {
                deleteGroup(editing.id);
                refreshMonitorConfig().catch(() => {});
                setEditing(null);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addMoreHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingLeft: 6,
    paddingRight: spacing.md,
    paddingVertical: 6,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
