import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';

import {
  AnimatedChoice,
  CollectionManager,
  Icon,
  OnboardingShell,
  PillButton,
  ScreenTitle,
  Txt,
  type SelectionFooter,
} from '@/components';
import { useVideos } from '@/store';
import { STARTER_PACKS } from '@/services/youtube';
import { colors, spacing } from '@/theme';
import type { VideoClip } from '@/store/types';

const PACK_IMAGES: Record<(typeof STARTER_PACKS)[number]['id'], string> = {
  motivational: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=72&w=700&auto=format&fit=crop',
  nature: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=72&w=700&auto=format&fit=crop',
  meditation: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=72&w=700&auto=format&fit=crop',
};

export default function VideosStep() {
  const library = useVideos((s) => s.library);
  const setLibrary = useVideos((s) => s.setLibrary);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([STARTER_PACKS[0].id]);
  const [reviewingPacks, setReviewingPacks] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectionFooter, setSelectionFooter] = useState<SelectionFooter | null>(null);
  const selectedClips = useMemo(
    () =>
      STARTER_PACKS.filter((pack) => selectedPackIds.includes(pack.id)).flatMap((pack) =>
        pack.clips.map((clip: VideoClip) => ({ ...clip })),
      ),
    [selectedPackIds],
  );

  useEffect(() => {
    Object.values(PACK_IMAGES).forEach((image) => Image.prefetch(image).catch(() => {}));
    STARTER_PACKS.forEach((pack) => {
      pack.clips.forEach((clip) => {
        if (clip.thumbnail) Image.prefetch(clip.thumbnail).catch(() => {});
      });
    });
  }, []);

  const proceed = () => router.push('/onboarding/apps');

  const onContinue = () => proceed();

  const togglePack = (pack: (typeof STARTER_PACKS)[number]) => {
    setSelectedPackIds((current) => {
      if (current.includes(pack.id)) {
        const next = current.filter((id) => id !== pack.id);
        return next.length ? next : current;
      }
      return [...current, pack.id];
    });
  };

  const reviewPacks = () => {
    setLibrary(selectedClips);
    setReviewingPacks(true);
  };

  const footer =
    selectionFooter && selectMode ? (
      <PillButton
        label={`Add ${selectionFooter.count} video${selectionFooter.count > 1 ? 's' : ''}`}
        onPress={selectionFooter.onAdd}
      />
    ) : selectMode ? null : reviewingPacks ? (
      <PillButton
        label={library.length === 0 ? 'Keep at least one video' : 'Continue'}
        disabled={library.length === 0}
        onPress={onContinue}
      />
    ) : (
      <PillButton label="See Videos" onPress={reviewPacks} />
    );

  return (
    <OnboardingShell stepIndex={5} onBack={() => (reviewingPacks ? setReviewingPacks(false) : router.back())} footer={footer}>
      <ScreenTitle
        title={reviewingPacks ? 'Your video library.' : 'Choose your video style.'}
        subtitle={
          reviewingPacks
            ? 'These are the clips HopOff can show when it blocks an app.'
            : 'Pick one or more styles of short videos for your intervention screen.'
        }
      />
      {!reviewingPacks ? (
        <View style={styles.packList}>
          {STARTER_PACKS.map((pack) => {
            const active = selectedPackIds.includes(pack.id);
            return (
            <AnimatedChoice
              key={pack.id}
              selected={active}
              onPress={() => togglePack(pack)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${pack.title}. ${pack.subtitle}`}
              style={[styles.pack, active && styles.packActive]}>
              <ImageBackground
                  source={{ uri: PACK_IMAGES[pack.id] }}
                  contentFit="cover"
                  cachePolicy="disk"
                  style={styles.packImage}>
                  <View style={styles.packShade} />
                  <View style={styles.packTop}>
                    <View style={[styles.packIcon, active && styles.packIconActive]}>
                      <Icon
                        name={pack.id === 'nature' ? 'sunrise' : pack.id === 'meditation' ? 'meditation' : 'spark'}
                        size={18}
                        color={active ? colors.black : colors.white}
                      />
                    </View>
                    <View style={styles.packTopRight}>
                      {pack.id === 'motivational' ? (
                        <View style={styles.recommendedTag}>
                          <Txt variant="caption" color={colors.white}>
                            Recommended
                          </Txt>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.packCopy}>
                    <Txt variant="button" color={colors.white}>{pack.title}</Txt>
                    <Txt variant="caption" color="rgba(255,255,255,0.72)">
                      {pack.subtitle}
                    </Txt>
                  </View>
                </ImageBackground>
              </AnimatedChoice>
          );
        })}
        </View>
      ) : (
        <CollectionManager
          searchLabel="Add your own videos"
          onSelectModeChange={setSelectMode}
          onSelectionFooterChange={setSelectionFooter}
        />
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  packList: {
    gap: spacing.md,
  },
  pack: {
    height: 126,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  packActive: {
    borderColor: colors.black,
    borderWidth: 2,
  },
  packImage: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  packShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  packTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendedTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  packIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  packIconActive: {
    backgroundColor: colors.white,
  },
  packCopy: {
    gap: 4,
  },
});
