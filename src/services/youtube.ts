import { config } from '@/config';

import type { VideoClip } from '@/store/types';
import { getProxyJson } from './secureApi';



// ---------------------------------------------------------------------------

// YouTube search service.

//

// Uses a server-side YouTube proxy when configured. The YouTube Data API key
// must never be bundled into the Expo app.

// Without a proxy, search reports that it is unavailable
// instead of pretending starter clips match the user's query.

//

// Search prefers YouTube Shorts (vertical 9:16) for phone-sized motivation clips.

// ---------------------------------------------------------------------------



/** Vertical Shorts poster when available; falls back to standard thumb. */

function ytThumb(id: string): string {

  return `https://i.ytimg.com/vi/${id}/oar2.jpg`;

}



/** Vertical clips up to 60s — Shorts-first, but allow full minute-long motivation clips. */
const CLIP_MAX_SEC = 60;
const PREFERRED_MAX_SEC = 45;



/** Vertical short for welcome hero ("Stop scrolling. Start living."). */
export const WELCOME_HERO_CLIP: VideoClip = {
  id: 'welcome-hero',
  source: 'youtube',
  youtubeId: 'D5SyEe5oGZU',
  title: 'Stop Scrolling, Start Living',
  author: 'YouTube Shorts',
  durationSec: 45,
  thumbnail: ytThumb('D5SyEe5oGZU'),
};

/** Pick one of these for the welcome screen — tell us which number you want. */
export const WELCOME_HERO_OPTIONS: VideoClip[] = [
  {
    id: 'welcome-opt-1',
    source: 'youtube',
    youtubeId: 'Zt4QfXPS_zo',
    title: 'Change Your Life In 30 Seconds',
    author: 'Motivation2Study',
    durationSec: 30,
    thumbnail: ytThumb('Zt4QfXPS_zo'),
  },
  {
    id: 'welcome-opt-2',
    source: 'youtube',
    youtubeId: 'IdTMDpizis8',
    title: 'Jocko Willink "GOOD" (Official)',
    author: 'Jocko Podcast',
    durationSec: 22,
    thumbnail: ytThumb('IdTMDpizis8'),
  },
  {
    id: 'welcome-opt-3',
    source: 'youtube',
    youtubeId: 'ZXsQAXx_ao0',
    title: 'Shia LaBeouf "Just Do It" Motivational Speech',
    author: 'MotivaShian',
    durationSec: 60,
    thumbnail: ytThumb('ZXsQAXx_ao0'),
  },
  {
    id: 'welcome-opt-4',
    source: 'youtube',
    youtubeId: 'wnHW6o8WMas',
    title: 'NO EXCUSES - Best Motivational Video',
    author: 'Motivation2Study',
    durationSec: 30,
    thumbnail: ytThumb('wnHW6o8WMas'),
  },
  {
    id: 'welcome-opt-5',
    source: 'youtube',
    youtubeId: 'yYxAN_GlACE',
    title: 'Change Your Life In 30 Seconds (alt cut)',
    author: 'Motivation2Study',
    durationSec: 30,
    thumbnail: ytThumb('yYxAN_GlACE'),
  },
];

/**
 * Three vertical YouTube Shorts seeded into a new user's library.
 * Titles/authors are accurate; durationSec is a best-effort default that gets
 * corrected on device via fetchClipMetadata() when a Data API key is present.
 */
export const STARTER_CLIPS: VideoClip[] = [
  {
    ...WELCOME_HERO_CLIP,
    id: 'starter-1',
  },
  {
    id: 'starter-2',
    source: 'youtube',
    youtubeId: 'BsblgcBB17A',
    title: "You're Lazy",
    author: 'Elevate Start',
    durationSec: 40,
    thumbnail: ytThumb('BsblgcBB17A'),
  },
  {
    id: 'starter-3',
    source: 'youtube',
    youtubeId: 'i4D_3IF35C0',
    title: 'Discipline and consistency is the key',
    author: 'Fearless Potential',
    durationSec: 45,
    thumbnail: ytThumb('i4D_3IF35C0'),
  },
];

export const STARTER_PACKS: {
  id: 'motivational' | 'nature' | 'meditation';
  title: string;
  subtitle: string;
  image: string;
  clips: VideoClip[];
}[] = [
  {
    id: 'motivational',
    title: 'Motivational',
    subtitle: 'High-energy clips for the hard stop.',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    clips: STARTER_CLIPS,
  },
  {
    id: 'nature',
    title: 'Nature Reset',
    subtitle: 'Scenery and outdoor resets without the feed.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    clips: [
      {
        id: 'nature-1',
        source: 'youtube',
        youtubeId: 'aXItOY0sLRY',
        title: 'Ocean Waves for a Quick Reset',
        author: 'Calm Nature',
        durationSec: 60,
        thumbnail: ytThumb('aXItOY0sLRY'),
      },
      {
        id: 'nature-2',
        source: 'youtube',
        youtubeId: 'NJuSStkIZBg',
        title: 'Nature Reset in 60 Seconds',
        author: 'Nature Break',
        durationSec: 60,
        thumbnail: ytThumb('NJuSStkIZBg'),
      },
      {
        id: 'nature-3',
        source: 'youtube',
        youtubeId: 'eKFTSSKCzWA',
        title: 'Forest Calm Reset',
        author: 'Nature Break',
        durationSec: 60,
        thumbnail: ytThumb('eKFTSSKCzWA'),
      },
    ],
  },
  {
    id: 'meditation',
    title: 'Meditation',
    subtitle: 'Breathing and guided calm for a clean reset.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    clips: [
      {
        id: 'meditation-1',
        source: 'youtube',
        youtubeId: 'kT2F7OHRqb0',
        title: '60-Second Guided Meditation',
        author: 'Headspace',
        durationSec: 60,
        thumbnail: ytThumb('kT2F7OHRqb0'),
      },
      {
        id: 'meditation-2',
        source: 'youtube',
        youtubeId: '2l0XVJ-0LMM',
        title: 'Learn Box Breathing in 60 Seconds',
        author: 'Mindful Reset',
        durationSec: 60,
        thumbnail: ytThumb('2l0XVJ-0LMM'),
      },
      {
        id: 'meditation-3',
        source: 'youtube',
        youtubeId: '-9c49GWOT78',
        title: '60 Second Meditation That Works',
        author: 'Meditation Short',
        durationSec: 60,
        thumbnail: ytThumb('-9c49GWOT78'),
      },
    ],
  },
];



const MOCK_LIBRARY: VideoClip[] = [

  ...STARTER_CLIPS,

  {

    id: 'm-goggins',

    source: 'youtube',

    youtubeId: 'IdTMDpizis8',

    title: 'Jocko Willink "GOOD" (Official)',

    author: 'Jocko Podcast',

    durationSec: 22,

    thumbnail: ytThumb('IdTMDpizis8'),

  },

  {

    id: 'm-discipline',

    source: 'youtube',

    youtubeId: 'ZXsQAXx_ao0',

    title: 'Shia LaBeouf "Just Do It" Motivational Speech',

    author: 'MotivaShian',

    durationSec: 60,

    thumbnail: ytThumb('ZXsQAXx_ao0'),

  },

  {

    id: 'm-wakeup',

    source: 'youtube',

    youtubeId: 'wnHW6o8WMas',

    title: 'NO EXCUSES - Best Motivational Video',

    author: 'Motivation2Study',

    durationSec: 17,

    thumbnail: ytThumb('wnHW6o8WMas'),

  },

];



function delay(ms: number) {

  return new Promise((r) => setTimeout(r, ms));

}



/** Parse an ISO-8601 duration (e.g. "PT1M5S") into seconds. */

function parseISODuration(iso: string): number {

  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!m) return 0;

  const [, h, min, s] = m;

  return (Number(h ?? 0) * 3600) + (Number(min ?? 0) * 60) + Number(s ?? 0);

}



function isShortClip(durationSec: number) {

  return durationSec > 0 && durationSec <= CLIP_MAX_SEC;

}



/** Prefer shorter vertical clips first. */

function rankShorts(clips: VideoClip[]): VideoClip[] {

  return [...clips].sort((a, b) => {

    const aPreferred = a.durationSec <= PREFERRED_MAX_SEC ? 0 : 1;

    const bPreferred = b.durationSec <= PREFERRED_MAX_SEC ? 0 : 1;

    if (aPreferred !== bPreferred) return aPreferred - bPreferred;

    return a.durationSec - b.durationSec;

  });

}



function mockSearch(query: string): VideoClip[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const shortsOnly = MOCK_LIBRARY.filter((v) => isShortClip(v.durationSec));
  const matched = shortsOnly.filter(
    (v) => v.title.toLowerCase().includes(q) || v.author.toLowerCase().includes(q),
  );
  return rankShorts(matched);
}



interface YTSearchItem {

  id: { videoId: string };

  snippet: { title: string; channelTitle: string; thumbnails: { high?: { url: string } } };

}

interface YTVideoItem {

  id: string;

  contentDetails: { duration: string };

}



async function fetchSearchResults(searchQuery: string): Promise<YTSearchItem[]> {

  const searchData = await getProxyJson(`/youtube/search-items?q=${encodeURIComponent(searchQuery)}`, (data) => {
    if (!data || typeof data !== 'object' || !Array.isArray((data as { items?: unknown }).items)) {
      return { items: [] };
    }
    return data as { items: YTSearchItem[] };
  });

  return searchData.items.filter((it) => it.id?.videoId);

}



async function hydrateClips(items: YTSearchItem[]): Promise<VideoClip[]> {

  if (!items.length) return [];



  const ids = items.map((it) => it.id.videoId).join(',');

  const detailsData = await getProxyJson(`/youtube/details?ids=${encodeURIComponent(ids)}`, (data) => {
    if (!data || typeof data !== 'object' || !Array.isArray((data as { items?: unknown }).items)) {
      return { items: [] };
    }
    return data as { items: YTVideoItem[] };
  });

  const durationById = new Map(

    detailsData.items.map((d) => [d.id, parseISODuration(d.contentDetails.duration)]),

  );



  return items.map((it) => ({

    id: it.id.videoId,

    source: 'youtube' as const,

    youtubeId: it.id.videoId,

    title: it.snippet.title,

    author: it.snippet.channelTitle,

    durationSec: durationById.get(it.id.videoId) ?? 0,

    thumbnail: ytThumb(it.id.videoId),

  }));

}



async function realSearch(query: string): Promise<VideoClip[]> {

  const trimmed = query.trim();

  const shortsQuery = trimmed.toLowerCase().includes('#shorts') ? trimmed : `${trimmed} #shorts`;



  const [shortsItems, broadItems] = await Promise.all([

    fetchSearchResults(shortsQuery),

    fetchSearchResults(trimmed),

  ]);



  const seen = new Set<string>();

  const merged: YTSearchItem[] = [];

  for (const item of [...shortsItems, ...broadItems]) {

    const id = item.id.videoId;

    if (seen.has(id)) continue;

    seen.add(id);

    merged.push(item);

  }



  const clips = await hydrateClips(merged);

  const shorts = rankShorts(clips.filter((c) => isShortClip(c.durationSec)));

  return shorts.slice(0, 20);

}



export class YouTubeSearchError extends Error {

  constructor(message: string) {

    super(message);

    this.name = 'YouTubeSearchError';

  }

}



export interface ClipMetadata {
  title: string;
  author: string;
  durationSec: number;
}

interface YTMetaItem {
  id: string;
  snippet?: { title?: string; channelTitle?: string };
  contentDetails?: { duration?: string };
}

/**
 * Fetch accurate title / author / duration for known YouTube ids via the Data
 * API. Returns an empty map when no key is configured or the request fails, so
 * callers can safely fall back to whatever metadata they already have.
 */
export async function fetchClipMetadata(ids: string[]): Promise<Map<string, ClipMetadata>> {
  const result = new Map<string, ClipMetadata>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!config.useRealYouTube || !unique.length) return result;

  try {
    const data = await getProxyJson(`/youtube/metadata?ids=${encodeURIComponent(unique.join(','))}`, (value) => {
      if (!value || typeof value !== 'object') return { items: [] };
      return value as { items?: YTMetaItem[] };
    });
    for (const item of data.items ?? []) {
      result.set(item.id, {
        title: item.snippet?.title ?? '',
        author: item.snippet?.channelTitle ?? '',
        durationSec: parseISODuration(item.contentDetails?.duration ?? ''),
      });
    }
  } catch (err) {
    console.warn('[youtube] fetchClipMetadata failed:', err);
  }

  return result;
}



/** Debounced search is handled by the caller. */

export async function searchYouTube(query: string): Promise<VideoClip[]> {

  if (!query.trim()) return [];

  if (config.useRealYouTube) {

    try {

      return await realSearch(query);

    } catch (err) {

      const msg = err instanceof Error ? err.message : 'Unknown error';

      console.warn('[youtube] real search failed:', msg);

      throw new YouTubeSearchError('Search failed — check API key or quota.');

    }

  }

  await delay(240);
  const fallback = mockSearch(query);
  if (fallback.length) return fallback;
  return [];

}
