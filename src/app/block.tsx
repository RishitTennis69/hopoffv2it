import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlockVideoFrame, EncryptedText, PillButton, Txt } from '@/components';
import { getApp } from '@/data/apps';
import { blockAlternative } from '@/services/insights';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { useGoals, useUsage, useVideos } from '@/store';
import type { VideoClip } from '@/store/types';

const RECLAIMED_MINUTES = 15;

export default function BlockScreen() {
  const insets = useSafeAreaInsets();
  const { appId } = useLocalSearchParams<{ appId?: string }>();
  const library = useVideos((s) => s.library);
  const goalLines = useGoals((s) => s.goalLines);
  const recordCommit = useUsage((s) => s.recordCommit);
  const recordWaste = useUsage((s) => s.recordWaste);

  const appName = appId ? getApp(appId)?.name ?? 'your apps' : 'your apps';

  // Pick a random clip (<=60s) once at mount.
  const [clip] = useState<VideoClip | null>(() => {
    const pool = library.filter((v) => v.durationSec <= 60);
    const list = pool.length ? pool : library;
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  });
  const [unlocked, setUnlocked] = useState(false);

  const alternative = useMemo(() => blockAlternative(goalLines()), [goalLines]);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/progress');
  };

  const onCommit = () => {
    haptics.success();
    recordCommit(RECLAIMED_MINUTES);
    dismiss();
  };

  const onWaste = () => {
    recordWaste();
    dismiss();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.headline}>
        <EncryptedText text="Enough scrolling." duration={500} />
        <EncryptedText text={`Your ${appName} limit's up.`} delay={520} duration={520} />
      </View>

      {clip ? (
        <View style={styles.videoArea}>
          <BlockVideoFrame clip={clip} onWatchedEnough={() => setUnlocked(true)} />
        </View>
      ) : (
        <View style={styles.videoArea} />
      )}

      <View style={styles.footer}>
        {unlocked ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.unlock}>
            <Txt variant="body" color={colors.textMuted} center>
              Right now you could: {alternative}
            </Txt>
            <PillButton label="I'll commit to do better" onPress={onCommit} />
            <Pressable onPress={onWaste} hitSlop={8}>
              <Txt variant="caption" color={colors.textFaint} center>
                {"I'll waste my life"}
              </Txt>
            </Pressable>
          </Animated.View>
        ) : (
          <Txt variant="caption" color={colors.textFaint} center>
            Watch for a moment…
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.screenH,
  },
  headline: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  unlock: {
    gap: spacing.md,
  },
});
