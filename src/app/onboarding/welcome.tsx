import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton, Txt, VideoFrame } from '@/components';
import { WELCOME_HERO_CLIP } from '@/services/youtube';
import { colors, fonts, radius, spacing } from '@/theme';
import { useOnboarding } from '@/store';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const completed = useOnboarding((s) => s.completed);
  const [playing, setPlaying] = useState(true);
  const compact = height < 720;

  useEffect(() => {
    if (completed) router.replace('/(tabs)/progress');
  }, [completed]);

  if (completed) return null;

  const hero = WELCOME_HERO_CLIP;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + (compact ? spacing.lg : spacing.xl),
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}>
      <View style={styles.header}>
        <Txt variant="hero" center numberOfLines={1} adjustsFontSizeToFit style={[styles.heroText, compact && styles.heroTextCompact]}>
          Your feed
        </Txt>
        <Txt variant="hero" center numberOfLines={1} adjustsFontSizeToFit style={[styles.heroText, compact && styles.heroTextCompact]}>
          stops here.
        </Txt>
      </View>

      <View style={styles.videoWrap}>
        <View style={[styles.video, compact && styles.videoCompact]}>
          <VideoFrame
            clip={hero}
            playing={playing}
            muted={false}
            noControls
            borderRadius={radius.card}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <PillButton
          label="Start My Reset"
          onPress={() => {
            setPlaying(false);
            router.push('/onboarding/screen-time');
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
  heroText: {
    fontFamily: fonts.displayBlack,
    fontSize: 46,
    lineHeight: 54,
    letterSpacing: 0,
    textShadowColor: colors.text,
    textShadowRadius: 0.45,
  },
  heroTextCompact: {
    fontSize: 40,
    lineHeight: 47,
  },
  videoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '92%',
    aspectRatio: 9 / 16,
    maxHeight: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoCompact: {
    width: '82%',
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
