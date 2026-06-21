import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { searchYouTube } from '@/services/youtube';
import { resolveSharedClip, simulateShare } from '@/services/shareIntake';
import { colors, spacing } from '@/theme';
import { useVideos } from '@/store';
import type { VideoClip } from '@/store/types';
import { PillButton } from './PillButton';
import { SearchBar } from './SearchBar';
import { ShareNote } from './ShareNote';
import { Txt } from './Txt';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';

interface Props {
  searchLabel?: string;
  showShareNote?: boolean;
  /** Notifies the parent so onboarding can hide its footer during select mode. */
  onSelectModeChange?: (active: boolean) => void;
}

export function CollectionManager({ searchLabel, showShareNote = true, onSelectModeChange }: Props) {
  const library = useVideos((s) => s.library);
  const lastAddedId = useVideos((s) => s.lastAddedId);
  const addVideo = useVideos((s) => s.addVideo);
  const removeVideo = useVideos((s) => s.removeVideo);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VideoClip[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [playing, setPlaying] = useState<VideoClip | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inSearch = results !== null;

  useEffect(() => {
    onSelectModeChange?.(inSearch);
  }, [inSearch, onSelectModeChange]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await searchYouTube(q);
    setResults(res);
    setSelected([]);
    setLoading(false);
  };

  const onChangeText = (t: string) => {
    setQuery(t);
    if (debounce.current) clearTimeout(debounce.current);
    if (!t.trim()) {
      setResults(null);
      return;
    }
    debounce.current = setTimeout(() => runSearch(t), 450);
  };

  const clearSearch = () => {
    if (debounce.current) clearTimeout(debounce.current);
    setQuery('');
    setResults(null);
    setSelected([]);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    haptics.selection();
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const addSelected = () => {
    if (!results) return;
    results.filter((r) => selected.includes(r.id)).forEach(addVideo);
    haptics.success();
    showToast(`Added ${selected.length} to library`);
    clearSearch();
  };

  const handleShare = async (platform: 'tiktok' | 'instagram') => {
    const pending = simulateShare(platform);
    addVideo(pending);
    showToast('Added to library');
    const resolved = await resolveSharedClip(pending);
    removeVideo(resolved.url ?? resolved.id);
    addVideo(resolved);
  };

  const grid = inSearch ? results! : library;

  return (
    <View style={{ gap: spacing.lg }}>
      {searchLabel ? (
        <Txt variant="subheading">{searchLabel}</Txt>
      ) : null}

      <SearchBar
        value={query}
        onChangeText={onChangeText}
        onSubmit={() => runSearch(query)}
        onClear={clearSearch}
        loading={loading}
        placeholder='Try "David Goggins"'
      />

      <View style={styles.grid}>
        {grid.map((clip) => {
          return (
            <View key={clip.id} style={styles.cell}>
              <VideoCard
                clip={clip}
                corner={inSearch ? (selected.includes(clip.id) ? 'added' : 'add') : 'trash'}
                selected={inSearch && selected.includes(clip.id)}
                flash={!inSearch && clip.id === lastAddedId}
                onPress={() => (inSearch ? toggleSelect(clip.id) : setPlaying(clip))}
                onCorner={() =>
                  inSearch ? toggleSelect(clip.id) : removeVideo(clip.id)
                }
              />
            </View>
          );
        })}
      </View>

      {inSearch && selected.length > 0 ? (
        <Animated.View entering={FadeInUp} exiting={FadeOut}>
          <PillButton label={`Add ${selected.length} video${selected.length > 1 ? 's' : ''}`} onPress={addSelected} />
        </Animated.View>
      ) : null}

      {!inSearch && showShareNote ? <ShareNote onShare={handleShare} /> : null}

      {toast ? (
        <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.toast}>
          <Txt variant="bodyStrong" color={colors.bg}>
            {toast}
          </Txt>
        </Animated.View>
      ) : null}

      <VideoPlayerModal clip={playing} onClose={() => setPlaying(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    width: '47.5%',
  },
  toast: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
});
