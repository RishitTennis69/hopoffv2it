import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';

import { Icon, OnboardingShell, PillButton, ScreenTitle, Txt } from '@/components';
import {
  PERMISSION_META,
  REQUIRED_PERMISSIONS,
  confirmPermission,
  getPermissionStatus,
  openPermissionSettings,
  permissionSteps,
} from '@/services/nativeUsage';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { useApps, useUsage } from '@/store';
import type { PermissionId } from '@/store/types';

export default function Permissions() {
  const steps = permissionSteps();
  const selectedIds = useApps((s) => s.selectedIds);
  const syncUsage = useUsage((s) => s.syncFromDevice);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<'open' | 'confirm'>('open');

  // When the user returns from system settings, refresh checkmarks.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        for (const step of steps) {
          const ok = await getPermissionStatus(step);
          if (ok) setDone((d) => ({ ...d, [step]: true }));
        }
      })();
    });
    return () => sub.remove();
  }, [steps]);

  const current = steps[currentIndex];
  const meta = PERMISSION_META[current];
  const requiredDone = REQUIRED_PERMISSIONS.every((p) => done[p]);

  const advance = () => {
    setPhase('open');
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/onboarding/paywall');
    }
  };

  const onOpen = async () => {
    await openPermissionSettings(current);
    setPhase('confirm');
  };

  const onConfirm = async () => {
    const ok = await confirmPermission(current);
    if (!ok) return;
    setDone((d) => ({ ...d, [current]: true }));
    haptics.success();
    if (current === 'usage' || current === 'screenTime') {
      syncUsage(selectedIds).catch(() => {});
    }
    advance();
  };

  const onSkip = () => {
    setDone((d) => ({ ...d, [current]: true }));
    advance();
  };

  const footer = (
    <PillButton
      label={phase === 'open' ? meta.openLabel : meta.confirmLabel}
      onPress={phase === 'open' ? onOpen : onConfirm}
    />
  );

  return (
    <OnboardingShell stepIndex={6} onBack={() => router.back()} footer={footer} scroll={false}>
      <View style={styles.body}>
        <ScreenTitle title="Turn on permissions" center />

        <View style={[styles.shield, requiredDone && styles.shieldOn]}>
          <Icon name="shield" size={40} color={requiredDone ? colors.bg : colors.text} />
          {requiredDone ? (
            <View style={styles.shieldCheck}>
              <Icon name="check" size={16} color={colors.bg} />
            </View>
          ) : null}
        </View>

        <Txt variant="body" color={colors.textMuted} center>
          HopOff uses on-device usage data to show your screen time and to step in when you pass a
          limit. Your data never leaves your phone.
        </Txt>

        <View style={styles.checklist}>
          {steps.map((id: PermissionId, i) => {
            const isActive = i === currentIndex;
            const isDone = done[id];
            const m = PERMISSION_META[id];
            return (
              <View key={id} style={styles.checkItem}>
                <View style={styles.row}>
                  <Txt variant="bodyStrong" color={colors.textMuted}>
                    {i + 1}.
                  </Txt>
                  <View style={[styles.circle, isDone && styles.circleOn]}>
                    {isDone ? <Icon name="check" size={12} color={colors.bg} /> : null}
                  </View>
                  <Txt variant="bodyStrong" color={isActive || isDone ? colors.text : colors.textMuted}>
                    {m.title}
                  </Txt>
                </View>
                {isActive && !isDone ? (
                  <Txt variant="caption" color={colors.textFaint} style={styles.path}>
                    {m.path}
                  </Txt>
                ) : null}
              </View>
            );
          })}
        </View>

        {meta.skippable && !done[current] ? (
          <Pressable onPress={onSkip} hitSlop={8}>
            <Txt variant="body" color={colors.textMuted} center>
              Skip
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  shield: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
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
    borderColor: colors.bg,
  },
  checklist: {
    alignSelf: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  checkItem: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  path: {
    marginLeft: 34,
  },
});
