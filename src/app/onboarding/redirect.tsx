import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppIcon, OnboardingShell, PillButton, ProductiveAppIcon, ScreenTitle, SearchBar, Txt } from '@/components';
import type { ProductiveApp } from '@/data/productiveApps';
import { suggestGoalApps } from '@/services/goalAppSuggestions';
import { getInstalledApps } from '@/services/nativeUsage';
import { useGoals } from '@/store';
import { colors, radius, spacing } from '@/theme';
import type { TrackedApp } from '@/store/types';

export default function RedirectStep() {
  const { width } = useWindowDimensions();
  const text = useGoals((s) => s.text);
  const goalApp = useGoals((s) => s.goalApp);
  const setGoalApp = useGoals((s) => s.setGoalApp);
  const [suggestions, setSuggestions] = useState<ProductiveApp[]>([]);
  const [installedApps, setInstalledApps] = useState<TrackedApp[]>([]);
  const [installedPackages, setInstalledPackages] = useState<Set<string> | null>(null);
  const [choosingApp, setChoosingApp] = useState(false);
  const [appQuery, setAppQuery] = useState('');
  const iconOnlyApps = width < 520;

  useEffect(() => {
    let cancelled = false;
    void getInstalledApps()
      .then((apps) => {
        if (!cancelled) {
          setInstalledApps(apps);
          setInstalledPackages(new Set(apps.map((app) => app.packageId)));
        }
      })
      .catch(() => {
        if (!cancelled) setInstalledPackages(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const goals = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    void suggestGoalApps(goals, 8).then((apps) => {
      if (cancelled) return;
      const installed = installedPackages
        ? apps.filter((app) => installedPackages.has(app.packageId))
        : apps;
      setSuggestions(installed.slice(0, 5));
    });

    return () => {
      cancelled = true;
    };
  }, [installedPackages, text]);

  const selectRedirectApp = (app: ProductiveApp) => {
    const selected = goalApp?.packageId === app.packageId;
    setGoalApp(
      selected
        ? null
        : {
            appId: app.id,
            name: app.name,
            packageId: app.packageId,
            type: 'app',
          },
    );
  };
  const selectInstalledApp = (app: TrackedApp) => {
    const selected = goalApp?.packageId === app.packageId;
    setGoalApp(
      selected
        ? null
        : {
            appId: app.id,
            name: app.name,
            packageId: app.packageId,
            type: 'app',
          },
    );
    setChoosingApp(false);
  };
  const searchedApps = installedApps
    .filter((app) => app.name.toLowerCase().includes(appQuery.trim().toLowerCase()))
    .slice(0, 6);
  const fallbackIconApps = installedApps.slice(0, 5);

  return (
    <OnboardingShell
      stepIndex={4}
      onBack={() => router.back()}
      footer={<PillButton label="Continue" onPress={() => router.push('/onboarding/videos')} />}>
      <ScreenTitle
        title="After HopOff blocks an app, what should happen?"
        subtitle="Stay in HopOff, or choose another app already on your phone."
      />

      <View style={styles.choiceStack}>
        <Pressable
          onPress={() => setGoalApp(null)}
          style={({ pressed }) => [styles.choiceCard, !goalApp && styles.choiceCardSelected, pressed && styles.cardPressed]}>
          <View style={styles.choiceHeader}>
            <View style={styles.choiceCopy}>
              <Txt variant="bodyStrong">Stay in HopOff</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                Show your goal and next step here.
              </Txt>
            </View>
            <View style={[styles.radio, !goalApp && styles.radioActive]} />
          </View>
        </Pressable>

        <View style={[styles.choiceCard, goalApp && styles.choiceCardSelected]}>
          <Pressable
            onPress={() => {
              if (suggestions[0] && !goalApp) selectRedirectApp(suggestions[0]);
              setChoosingApp(true);
            }}
            style={({ pressed }) => [styles.choiceHeader, pressed && styles.cardPressed]}>
            <View style={styles.choiceCopy}>
              <Txt variant="bodyStrong">Go to another app</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                Pick a better next move.
              </Txt>
            </View>
            <View style={[styles.radio, goalApp && styles.radioActive]} />
          </Pressable>

          {suggestions.length ? (
            <View style={styles.appGrid}>
              {suggestions.map((app) => {
                const selected = goalApp?.packageId === app.packageId;
                return (
                  <Pressable
                    key={app.id}
                    onPress={() => selectRedirectApp(app)}
                    style={({ pressed }) => [
                      styles.appPill,
                      iconOnlyApps && styles.appPillIconOnly,
                      selected && styles.appPillSelected,
                      pressed && styles.cardPressed,
                    ]}
                    accessibilityLabel={app.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <ProductiveAppIcon id={app.id} size={30} />
                    {iconOnlyApps ? null : (
                      <Txt variant="caption" color={selected ? colors.white : colors.text} numberOfLines={1}>
                        {app.name}
                      </Txt>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Pressable onPress={() => setChoosingApp(true)} style={styles.appGrid}>
              {fallbackIconApps.map((app) => (
                <View key={app.id} style={styles.appPillIconOnly}>
                  <AppIcon brand={app.brand} size={30} />
                </View>
              ))}
            </Pressable>
          )}

          {choosingApp ? (
            <View style={styles.searchStack}>
              <SearchBar
                value={appQuery}
                onChangeText={setAppQuery}
                onSubmit={() => {}}
                onClear={() => setAppQuery('')}
                placeholder="Search installed apps"
                compact
                hideAction
              />
              <View style={styles.searchResults}>
                {searchedApps.map((app) => (
                  <Pressable
                    key={app.id}
                    onPress={() => selectInstalledApp(app)}
                    style={({ pressed }) => [styles.searchResult, pressed && styles.cardPressed]}>
                    <AppIcon brand={app.brand} size={30} />
                    <Txt variant="caption" color={colors.text} numberOfLines={1}>
                      {app.name}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  choiceStack: {
    gap: spacing.md,
  },
  choiceCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  choiceCardSelected: {
    borderColor: colors.black,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    borderRadius: 18,
  },
  choiceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textFaint,
    flexShrink: 0,
  },
  radioActive: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  cardPressed: {
    backgroundColor: colors.pressFill,
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  appPill: {
    minHeight: 42,
    maxWidth: '48%',
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingLeft: 6,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appPillIconOnly: {
    width: 44,
    height: 44,
    minHeight: 44,
    maxWidth: 44,
    borderRadius: 22,
    paddingLeft: 0,
    paddingRight: 0,
    justifyContent: 'center',
  },
  appPillSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  searchStack: {
    gap: spacing.sm,
  },
  searchResults: {
    gap: spacing.xs,
  },
  searchResult: {
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
