import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STARTER_CLIPS } from '@/services/youtube';
import type { VideoClip } from './types';
import { persistStorage } from './storage';

interface VideosState {
  library: VideoClip[];
  /** id of the most recently added clip (for the entry flash highlight). */
  lastAddedId?: string;

  addVideo: (clip: VideoClip) => void;
  removeVideo: (id: string) => void;
  hasVideo: (clip: VideoClip) => boolean;
  clearLastAdded: () => void;
  reset: () => void;
}

/** Two clips are "the same" if they point at the same youtube id / url. */
function sameClip(a: VideoClip, b: VideoClip): boolean {
  if (a.youtubeId && b.youtubeId) return a.youtubeId === b.youtubeId;
  if (a.url && b.url) return a.url === b.url;
  return a.id === b.id;
}

export const useVideos = create<VideosState>()(
  persist(
    (set, get) => ({
      library: STARTER_CLIPS,
      lastAddedId: undefined,

      addVideo: (clip) => {
        if (get().library.some((v) => sameClip(v, clip))) return;
        const stable: VideoClip = { ...clip, id: clip.youtubeId ?? clip.url ?? clip.id };
        set((s) => ({ library: [stable, ...s.library], lastAddedId: stable.id }));
      },
      removeVideo: (id) => set((s) => ({ library: s.library.filter((v) => v.id !== id) })),
      hasVideo: (clip) => get().library.some((v) => sameClip(v, clip)),
      clearLastAdded: () => set({ lastAddedId: undefined }),
      reset: () => set({ library: STARTER_CLIPS, lastAddedId: undefined }),
    }),
    {
      name: 'hopoff.videos',
      storage: persistStorage,
      partialize: (s) => ({ library: s.library }),
    },
  ),
);
