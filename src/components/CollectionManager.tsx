import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { searchYouTube, YouTubeSearchError } from '@/services/youtube';
import { colors, spacing } from '@/theme';
import { useVideos } from '@/store';
import type { VideoClip } from '@/store/types';
import { SearchBar } from './SearchBar';
import { Txt } from './Txt';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';

export interface SelectionFooter {
  count: number;
  onAdd: () => void;
  onClear: () => void;
}

interface Props {
  searchLabel?: string;
  showShareNote?: boolean;
  onSelectModeChange?: (active: boolean) => void;
  onSelectionFooterChange?: (footer: SelectionFooter | null) => void;
}

export function CollectionManager({
  searchLabel,
  showShareNote = false,
  onSelectModeChange,
  onSelectionFooterChange,
}: Props) {
  const library = useVideos((s) => s.library);
  const lastAddedId = useVideos((s) => s.lastAddedId);
  const addVideo = useVideos((s) => s.addVideo);
  const removeVideo = useVideos((s) => s.removeVideo);
  const hasVideo = useVideos((s) => s.hasVideo);

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
    try {
      const res = await searchYouTube(q);
      setResults(res);
      setSelected([]);
    } catch (err) {
      setResults([]);
      showToast(err instanceof YouTubeSearchError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
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

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  const addSelected = useCallback(() => {
    if (!results) return;
    const picked = results.filter((r) => selected.includes(r.id));
    let added = 0;
    let skipped = 0;
    picked.forEach((clip) => {
      if (hasVideo(clip)) skipped += 1;
      else {
        addVideo(clip);
        added += 1;
      }
    });
    haptics.success();
    if (added === 0 && skipped > 0) {
      showToast('Already in your library');
    } else if (skipped > 0) {
      showToast(`Added ${added} / ${skipped} already in library`);
    } else {
      showToast(`Added ${added} to library`);
    }
    clearSearch();
  }, [addVideo, hasVideo, results, selected]);

  useEffect(() => {
    if (!onSelectionFooterChange) return;
    if (inSearch && selected.length > 0) {
      onSelectionFooterChange({ count: selected.length, onAdd: addSelected, onClear: clearSelection });
    } else {
      onSelectionFooterChange(null);
    }
  }, [inSearch, selected.length, onSelectionFooterChange, addSelected, clearSelection]);

  const grid = inSearch ? results! : library;

  return (
    <View style={{ gap: spacing.lg }}>
      {searchLabel ? <Txt variant="subheading">{searchLabel}</Txt> : null}

      <SearchBar
        value={query}
        onChangeText={onChangeText}
        onSubmit={() => runSearch(query)}
        onClear={clearSearch}
        loading={loading}
        placeholder='Try "gym edit"'
      />
      {inSearch && selected.length > 0 ? (
        <Pressable onPress={clearSelection} hitSlop={8} style={styles.clearRow}>
          <Txt variant="caption" color={colors.textMuted}>
            Clear selection ({selected.length})
          </Txt>
        </Pressable>
      ) : null}

      <View style={styles.grid}>
        {grid.map((clip) => (
          <View key={clip.id} style={styles.cell}>
            <VideoCard
              clip={clip}
              corner={inSearch ? (selected.includes(clip.id) ? 'added' : 'add') : 'trash'}
              selected={inSearch && selected.includes(clip.id)}
              flash={!inSearch && clip.id === lastAddedId}
              onSelect={inSearch ? () => toggleSelect(clip.id) : undefined}
              onPlay={() => setPlaying(clip)}
              onCorner={() => (inSearch ? toggleSelect(clip.id) : removeVideo(clip.id))}
            />
          </View>
        ))}
      </View>

      {!inSearch && showShareNote ? (
        <Txt variant="caption" color={colors.textMuted}>
          TikTok and Instagram importing is paused while we make it reliable.
        </Txt>
      ) : null}

      {toast ? (
        <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.toast}>
          <Txt variant="bodyStrong" color={colors.text}>
            {toast}
          </Txt>
        </Animated.View>
      ) : null}

      <VideoPlayerModal clip={playing} onClose={() => setPlaying(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  clearRow: {
    alignSelf: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    width: '47.5%',
    minWidth: 0,
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
