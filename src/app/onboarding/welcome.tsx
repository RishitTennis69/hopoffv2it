import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton, Txt, VideoFrame } from '@/components';
import { STARTER_CLIPS } from '@/services/youtube';
import { colors, radius, spacing } from '@/theme';
import { useOnboarding } from '@/store';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const completed = useOnboarding((s) => s.completed);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (completed) router.replace('/(tabs)/progress');
  }, [completed]);

  if (completed) return null;

  const hero = STARTER_CLIPS[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.header}>
        <Txt variant="caption" color={colors.textMuted} center>
          HopOff
        </Txt>
        <Txt variant="hero" center>
          Stop scrolling.
        </Txt>
        <Txt variant="hero" center>
          Start living.
        </Txt>
      </View>

      <View style={styles.videoWrap}>
        <View style={styles.video}>
          <VideoFrame clip={hero} playing={playing} muted={false} borderRadius={radius.card} />
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton
          label="Start My HopOff Journey"
          onPress={() => {
            setPlaying(false);
            router.push('/onboarding/questions');
          }}
        />
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
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  videoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '86%',
    aspectRatio: 9 / 16,
    maxHeight: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
