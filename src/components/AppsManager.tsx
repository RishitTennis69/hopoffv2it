import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { refreshMonitorConfig } from '@/services/blockMonitor';
import { getInstalledApps, openScreenTimeAppPicker } from '@/services/nativeUsage';
import { shouldShowByDefault, sortBlockableApps } from '@/lib/appFiltering';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { useApps, useOnboarding } from '@/store';
import type { AppGroup, TrackedApp } from '@/store/types';
import { AppIcon } from './AppIcon';
import { GroupCard } from './GroupCard';
import { GroupModal } from './GroupModal';
import { PillButton } from './PillButton';
import { SearchBar } from './SearchBar';
import { SelectRow } from './SelectRow';
import { Txt } from './Txt';

export function AppsManager({
  showSessionControls = true,
  groupsFirst = false,
}: {
  showSessionControls?: boolean;
  groupsFirst?: boolean;
}) {
  const selectedIds = useApps((s) => s.selectedIds);
  const groups = useApps((s) => s.groups);
  const customApps = useApps((s) => s.customApps);
  const toggleSelect = useApps((s) => s.toggleSelect);
  const setSelected = useApps((s) => s.setSelected);
  const addCustomApp = useApps((s) => s.addCustomApp);
  const createGroup = useApps((s) => s.createGroup);
  const updateGroup = useApps((s) => s.updateGroup);
  const deleteGroup = useApps((s) => s.deleteGroup);
  const preferredSessionCount = useOnboarding((s) => s.preferredSessionCount);

  const [installed, setInstalled] = useState<TrackedApp[]>([]);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createIds, setCreateIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<AppGroup | null>(null);
  const [screenTimeSummary, setScreenTimeSummary] = useState<{
    applications: number;
    categories: number;
    webDomains: number;
  } | null>(null);

  useEffect(() => {
    getInstalledApps().then(setInstalled);
  }, []);

  const groupedIds = useMemo(() => new Set(groups.flatMap((g) => g.appIds)), [groups]);
  const ungroupedSelected = selectedIds.filter((id) => !groupedIds.has(id));
  const hasGroups = groups.length > 0;
  const normalizedQuery = query.trim().toLowerCase();
  const listApps = sortBlockableApps(installed)
    .filter((a) => !groupedIds.has(a.id))
    .filter((a) => {
      if (!normalizedQuery) return shouldShowByDefault(a);
      return a.name.toLowerCase().includes(normalizedQuery) || a.packageId.toLowerCase().includes(normalizedQuery);
    });
  const canAddPackage =
    normalizedQuery.includes('.') &&
    !installed.some((a) => a.packageId.toLowerCase() === normalizedQuery) &&
    !customApps.some((a) => a.packageId.toLowerCase() === normalizedQuery);
  const allSelected = listApps.length > 0 && listApps.every((a) => selectedIds.includes(a.id));

  const persistAndSelect = (app: TrackedApp) => {
    if (app.id.startsWith('custom:') && !customApps.some((custom) => custom.id === app.id)) {
      addCustomApp({ name: app.name, packageId: app.packageId });
      return;
    }
    toggleSelect(app.id);
  };

  const addPackageFromSearch = () => {
    if (!canAddPackage) return;
    const packageId = query.trim();
    addCustomApp({ name: packageId, packageId });
    setQuery('');
  };

  const toggleSelectAll = () => {
    haptics.selection();
    if (allSelected) {
      setSelected(selectedIds.filter((id) => !listApps.some((a) => a.id === id)));
    } else {
      const ids = listApps.map((app) => {
        if (app.id.startsWith('custom:') && !customApps.some((custom) => custom.id === app.id)) {
          return addCustomApp({ name: app.name, packageId: app.packageId });
        }
        return app.id;
      });
      setSelected(Array.from(new Set([...selectedIds, ...ids])));
    }
  };

  const chooseWithScreenTime = async () => {
    haptics.selection();
    const summary = await openScreenTimeAppPicker();
    setScreenTimeSummary(summary);
    getInstalledApps().then(setInstalled);
  };

  const openCreate = () => {
    setCreateIds(ungroupedSelected);
    setCreateOpen(true);
  };

  const setGroupSessions = (group: AppGroup, count: number) => {
    const totalMinutes = Math.max(5, Math.round(group.limitHours * 60));
    const sessionLimitMinutes = Math.round(totalMinutes / count);
    updateGroup(group.id, { sessionCount: count, sessionLimitMinutes });
    refreshMonitorConfig().catch(() => {});
  };

  const groupsSection = hasGroups ? (
    <View style={{ gap: spacing.md }}>
      <Txt variant="caption" color={colors.textMuted}>
        LIMIT SETS
      </Txt>
      {groups.map((g) => (
        <View key={g.id}>
          <GroupCard
            group={g}
            onPress={() => setEditing(g)}
            onDelete={() => {
              deleteGroup(g.id);
              refreshMonitorConfig().catch(() => {});
            }}
            onSessionCountChange={showSessionControls ? (count) => setGroupSessions(g, count) : undefined}
          />
        </View>
      ))}
    </View>
  ) : null;

  const pickerSection = (
      <View style={{ gap: spacing.lg }}>
        <View style={styles.listHead}>
          <Txt variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.listHeadLabel}>
            {Platform.OS === 'ios' ? 'POPULAR APPS TO BLOCK' : hasGroups ? 'YOUR APPS' : 'INSTALLED ON YOUR PHONE'}
          </Txt>
          {listApps.length > 0 ? (
            <Pressable onPress={toggleSelectAll} hitSlop={8}>
              <Txt variant="caption" color={colors.text} numberOfLines={1}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Txt>
            </Pressable>
          ) : null}
        </View>

        <SearchBar
          compact
          value={query}
          onChangeText={setQuery}
          onSubmit={addPackageFromSearch}
          onClear={() => setQuery('')}
          placeholder="Search installed apps"
        />

        {Platform.OS === 'ios' ? (
          <View style={styles.screenTimePanel}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Txt variant="bodyStrong">Select apps with Screen Time</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {screenTimeSummary && screenTimeSummary.applications + screenTimeSummary.categories + screenTimeSummary.webDomains > 0
                  ? `${screenTimeSummary.applications} apps, ${screenTimeSummary.categories} categories, ${screenTimeSummary.webDomains} websites selected.`
                  : 'Use Apple’s private picker for exact app blocking on iPhone.'}
              </Txt>
            </View>
            <PillButton label="Choose" variant="light" onPress={chooseWithScreenTime} style={styles.screenTimeButton} />
          </View>
        ) : null}

        {listApps.map((a) => (
          <SelectRow
            key={a.id}
            label={a.name}
            selected={selectedIds.includes(a.id)}
            onPress={() => persistAndSelect(a)}
            left={<AppIcon brand={a.brand} size={36} />}
            checkStyle="circle"
          />
        ))}

        {normalizedQuery && listApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Txt variant="caption" color={colors.textMuted} center>
              {canAddPackage ? 'Press enter to add this package.' : 'No apps found'}
            </Txt>
          </View>
        ) : null}
      </View>
  );

  return (
    <View style={{ gap: spacing.xxl }}>
      {groupsFirst ? groupsSection : null}

      {pickerSection}

      <PillButton
        label={ungroupedSelected.length < 1 ? 'Pick at least one app' : 'Set Their Limit'}
        variant="dark"
        disabled={ungroupedSelected.length < 1}
        onPress={openCreate}
        style={ungroupedSelected.length >= 1 ? styles.createReady : undefined}
      />

      {!groupsFirst ? groupsSection : null}

      <GroupModal
        key={`create-${createOpen}`}
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        appIds={createIds}
        initialSessionCount={preferredSessionCount}
        onSave={(name, limit, sessionCount, sessionLimitMinutes) => {
          createGroup(name || `Group ${groups.length + 1}`, createIds, limit, sessionCount, sessionLimitMinutes);
          refreshMonitorConfig().catch(() => {});
          setCreateOpen(false);
        }}
      />

      <GroupModal
        key={`edit-${editing?.id ?? 'none'}`}
        visible={!!editing}
        onClose={() => setEditing(null)}
        appIds={editing?.appIds ?? []}
        initialName={editing?.name}
        initialLimit={editing?.limitHours}
        initialSessionCount={editing?.sessionCount}
        onSave={(name, limit, sessionCount, sessionLimitMinutes) => {
          if (editing) updateGroup(editing.id, { name, limitHours: limit, sessionCount, sessionLimitMinutes });
          refreshMonitorConfig().catch(() => {});
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  listHeadLabel: {
    flex: 1,
    minWidth: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  screenTimePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
  },
  screenTimeButton: {
    minWidth: 94,
  },
  createReady: {
    borderColor: colors.black,
    borderWidth: StyleSheet.hairlineWidth * 4,
    shadowColor: colors.black,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
});
