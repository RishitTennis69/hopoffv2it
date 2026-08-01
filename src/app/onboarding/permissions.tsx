import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AppState, LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon, OnboardingShell, PillButton, ScreenTitle, Txt } from '@/components';
import {
  PERMISSION_META,
  getPermissionStatus,
  openPermissionSettings,
  permissionSteps,
} from '@/services/nativeUsage';
import { haptics } from '@/lib/haptics';
import { trackedAppIds } from '@/lib/trackedApps';
import { colors, spacing } from '@/theme';
import { useApps, useUsage } from '@/store';
import type { PermissionId } from '@/store/types';

const COLOR_MS = 120;
const BOUNCE_MS = 90;
const FINISH_MS = COLOR_MS + BOUNCE_MS * 2;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function mergePermissionDone(
  prev: Record<string, boolean>,
  fromOs: Record<string, boolean>,
  steps: PermissionId[],
): Record<string, boolean> {
  const next = { ...fromOs };
  for (const step of steps) {
    if (prev[step]) next[step] = true;
  }
  return next;
}

export default function Permissions() {
  const params = useLocalSearchParams<{ only?: PermissionId; next?: string; step?: string }>();
  const steps = useMemo(() => {
    if (params.only === 'usage') return ['usage'] as PermissionId[];
    if (params.only === 'screenTime') return ['screenTime'] as PermissionId[];
    if (Platform.OS === 'android') return ['usage', 'accessibility'] as PermissionId[];
    return permissionSteps();
  }, [params.only]);
  const nextRoute = params.next ?? '/onboarding/screen-time';
  const stepIndex = Number(params.step ?? 0);
  const selectedIds = useApps((s) => s.selectedIds);
  const groups = useApps((s) => s.groups);
  const syncUsage = useUsage((s) => s.syncFromDevice);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const [celebrating, setCelebrating] = useState(false);
  const [shieldLit, setShieldLit] = useState(false);
  const userConfirmed = useRef<Set<PermissionId>>(new Set());
  const returnedFromSettings = useRef(false);
  const autoAdvanced = useRef(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shieldScale = useSharedValue(1);
  const shieldFill = useSharedValue(0);

  const appIds = useMemo(() => trackedAppIds(selectedIds, groups), [selectedIds, groups]);

  const finishOnboarding = useCallback(async () => {
    try {
      await syncUsage(appIds);
    } catch {
      // Usage may still be stale at the OS level — Progress re-syncs on focus.
    }
    router.replace(nextRoute as never);
  }, [appIds, nextRoute, syncUsage]);

  const playFinishAndAdvance = useCallback(() => {
    setCelebrating(true);
    haptics.success();
    shieldFill.set(withTiming(1, { duration: COLOR_MS }, (colorDone) => {
      if (!colorDone) return;
      runOnJS(setShieldLit)(true);
      shieldScale.set(withSequence(
        withTiming(1.1, { duration: BOUNCE_MS }),
        withTiming(1, { duration: BOUNCE_MS }),
      ));
    }));
    finishTimer.current = setTimeout(() => {
      void finishOnboarding();
    }, FINISH_MS);
  }, [finishOnboarding, shieldFill, shieldScale]);

  const completeStep = useCallback(
    (step: PermissionId, nextDone: Record<string, boolean>) => {
      userConfirmed.current.add(step);
      if (step === 'usage' || step === 'screenTime') {
        syncUsage(appIds).catch(() => {});
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDone(nextDone);
      returnedFromSettings.current = false;
    },
    [appIds, syncUsage],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fromOs: Record<string, boolean> = {};
      for (const step of steps) {
        fromOs[step] = await getPermissionStatus(step);
      }
      if (cancelled) return;
      setDone((prev) => mergePermissionDone(prev, fromOs, steps));
    })();
    return () => {
      cancelled = true;
    };
  }, [steps]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        const fromOs: Record<string, boolean> = {};
        for (const step of steps) {
          if (userConfirmed.current.has(step)) {
            fromOs[step] = true;
            continue;
          }
          fromOs[step] = await getPermissionStatus(step);
        }
        setDone((prev) => {
          const merged = mergePermissionDone(prev, fromOs, steps);
          const active = steps.find((s) => !prev[s] && merged[s]);
          if (active && returnedFromSettings.current) {
            haptics.success();
            if (active === 'usage' || active === 'screenTime') {
              syncUsage(appIds).catch(() => {});
            }
            userConfirmed.current.add(active);
            returnedFromSettings.current = false;
          }
          return merged;
        });
      })();
    });
    return () => sub.remove();
  }, [appIds, steps, syncUsage]);

  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    },
    [],
  );

  const activeStep = steps.find((s) => !done[s]) ?? null;
  const allDone = steps.every((s) => done[s]);
  const currentStep = activeStep ?? steps[steps.length - 1];
  const stepMeta = PERMISSION_META[currentStep];

  useEffect(() => {
    if (!allDone || celebrating || autoAdvanced.current) return;
    autoAdvanced.current = true;
    const timer = setTimeout(() => {
      playFinishAndAdvance();
    }, 0);
    return () => clearTimeout(timer);
  }, [allDone, celebrating, playFinishAndAdvance]);

  const shieldAnim = useAnimatedStyle(() => ({
    transform: [{ scale: shieldScale.value }],
    backgroundColor: interpolateColor(
      shieldFill.value,
      [0, 1],
      [colors.surface, colors.surface],
    ),
    borderColor: interpolateColor(
      shieldFill.value,
      [0, 1],
      [colors.glassBorder, colors.glassBorderActive],
    ),
  }));

  const shieldIconColor = shieldLit ? colors.black : colors.textMuted;

  const onStepPress = async () => {
    if (!activeStep || celebrating) return;

    const ok = await getPermissionStatus(activeStep);
    if (ok) {
      haptics.success();
      completeStep(activeStep, { ...done, [activeStep]: true });
      return;
    }

    // Not granted yet — send them to Settings. The AppState listener auto-detects
    // the grant when they return, so there's no manual "I've turned it on" step.
    returnedFromSettings.current = true;
    await openPermissionSettings(activeStep);
  };

  const stepLabel = stepMeta.openLabel;

  const footer = celebrating || allDone ? null : (
    <View style={styles.footerStack}>
      <PillButton label={stepLabel} onPress={onStepPress} />
    </View>
  );

  const title = 'Connect HopOff.';
  const subtitle =
    params.only === 'usage'
      ? 'Your usage data stays on your phone. HopOff only uses it to show your real screen time and set better limits.'
      : 'Your usage data stays on your phone. HopOff uses these permissions to track limits and block distracting apps.';

  return (
    <OnboardingShell stepIndex={stepIndex} onBack={() => router.back()} footer={footer} scroll={false}>
      <View style={styles.body}>
        <ScreenTitle title={title} subtitle={subtitle} center />

        <Animated.View style={[styles.shield, shieldAnim]}>
          <Icon name="shield" size={34} color={shieldIconColor} />
          {celebrating ? (
            <View style={styles.shieldCheck}>
              <Icon name="check" size={16} color={colors.white} />
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.checklist}>
          {steps.map((id: PermissionId) => {
            const isFocus = id === activeStep && !allDone && !celebrating;
            const isDone = done[id];
            const m = PERMISSION_META[id];
            return (
              <View
                key={id}
                style={[styles.checkItem, isFocus && styles.checkItemFocus, isDone && styles.checkItemDone]}>
                <View style={styles.row}>
                  <View style={styles.permissionCopy}>
                    <Txt
                      variant="bodyStrong"
                      color={isDone ? colors.textMuted : isFocus ? colors.text : colors.textFaint}>
                      {m.title}
                    </Txt>
                    <Txt variant="caption" color={colors.textMuted}>
                      {id === 'usage'
                        ? 'Shows your real usage and powers the limit meter.'
                        : 'Lets HopOff step in when a blocked app opens.'}
                    </Txt>
                  </View>
                  {isDone ? (
                    <View style={styles.circleDone}>
                      <Icon name="check" size={11} color={colors.white} />
                    </View>
                  ) : (
                    <View style={[styles.circle, isFocus && styles.circleFocus]} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  shield: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  shieldCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  checklist: {
    alignSelf: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  checkItem: {
    gap: spacing.xs,
    opacity: 0.72,
    minHeight: 82,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  checkItemFocus: {
    opacity: 1,
  },
  checkItemDone: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionCopy: {
    flex: 1,
    gap: 4,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textFaint,
  },
  circleFocus: {
    borderColor: colors.black,
  },
  circleDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  path: {
    marginLeft: 34,
  },
  footerStack: {
    gap: spacing.sm,
  },
});
