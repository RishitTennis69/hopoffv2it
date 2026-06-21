import { YOUTUBE_API_KEY, config } from '@/config';
import type { VideoClip } from '@/store/types';

// ---------------------------------------------------------------------------
// YouTube search service.
//
// Uses the real YouTube Data API v3 when EXPO_PUBLIC_YOUTUBE_API_KEY is set
// (see src/config.ts); otherwise falls back to a seeded in-memory dataset so
// the app still runs fully offline with zero API keys.
// ---------------------------------------------------------------------------

function ytThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Three curated shorts pre-seeded into a new user's library. */
export const STARTER_CLIPS: VideoClip[] = [
  {
    id: 'starter-1',
    source: 'youtube',
    youtubeId: 'fzmou3uYwYU',
    title: "You'll Stop Wasting Your Time After This",
    author: 'BoltMotivation',
    durationSec: 57,
    thumbnail: ytThumb('fzmou3uYwYU'),
  },
  {
    id: 'starter-2',
    source: 'youtube',
    youtubeId: 'wnHW6o8WMas',
    title: 'You Have To Want It.',
    author: 'ethan armstrong',
    durationSec: 17,
    thumbnail: ytThumb('wnHW6o8WMas'),
  },
  {
    id: 'starter-3',
    source: 'youtube',
    youtubeId: 'mgmVOuLgFB0',
    title: "Your Life Is Hard? Good.",
    author: 'MindLab',
    durationSec: 42,
    thumbnail: ytThumb('mgmVOuLgFB0'),
  },
];

const MOCK_LIBRARY: VideoClip[] = [
  ...STARTER_CLIPS,
  {
    id: 'm-goggins',
    source: 'youtube',
    youtubeId: 'tFvSwbWXqxw',
    title: 'Who Is Going To Carry The Boats',
    author: 'David Goggins',
    durationSec: 33,
    thumbnail: ytThumb('tFvSwbWXqxw'),
  },
  {
    id: 'm-discipline',
    source: 'youtube',
    youtubeId: 'L9Oa3Hd6Zt0',
    title: 'Discipline Over Motivation',
    author: 'Jocko Willink',
    durationSec: 48,
    thumbnail: ytThumb('L9Oa3Hd6Zt0'),
  },
  {
    id: 'm-time',
    source: 'youtube',
    youtubeId: 'arj7oStGLkU',
    title: 'Time Is The Only Currency',
    author: 'Inside Quest',
    durationSec: 59,
    thumbnail: ytThumb('arj7oStGLkU'),
  },
  {
    id: 'm-present',
    source: 'youtube',
    youtubeId: 'IdTMDpizis8',
    title: 'Be Where Your Feet Are',
    author: 'MindLab',
    durationSec: 22,
    thumbnail: ytThumb('IdTMDpizis8'),
  },
  {
    id: 'm-wakeup',
    source: 'youtube',
    youtubeId: 'g-jwWYX7Jlo',
    title: 'Wake Up And Attack The Day',
    author: 'BoltMotivation',
    durationSec: 38,
    thumbnail: ytThumb('g-jwWYX7Jlo'),
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

function mockSearch(query: string): VideoClip[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matched = MOCK_LIBRARY.filter(
    (v) => v.title.toLowerCase().includes(q) || v.author.toLowerCase().includes(q),
  );
  const base = matched.length ? matched : MOCK_LIBRARY;
  return base.map((v, i) => ({
    ...v,
    id: `search-${q}-${i}`,
    title: matched.length ? v.title : `${query} — ${v.title}`,
  }));
}

interface YTSearchItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; thumbnails: { high?: { url: string } } };
}
interface YTVideoItem {
  id: string;
  contentDetails: { duration: string };
}

async function realSearch(query: string): Promise<VideoClip[]> {
  const searchUrl =
    'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video' +
    `&videoDuration=short&videoEmbeddable=true&maxResults=20&q=${encodeURIComponent(query)}` +
    `&key=${YOUTUBE_API_KEY}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
  const searchData = (await searchRes.json()) as { items: YTSearchItem[] };
  const items = searchData.items?.filter((it) => it.id?.videoId) ?? [];
  if (!items.length) return [];

  // Hydrate durations in one batch.
  const ids = items.map((it) => it.id.videoId).join(',');
  const detailsUrl =
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}` +
    `&key=${YOUTUBE_API_KEY}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = detailsRes.ok
    ? ((await detailsRes.json()) as { items: YTVideoItem[] })
    : { items: [] };
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
    thumbnail: it.snippet.thumbnails.high?.url ?? ytThumb(it.id.videoId),
  }));
}

/** Debounced search is handled by the caller. */
export async function searchYouTube(query: string): Promise<VideoClip[]> {
  if (!query.trim()) return [];
  if (config.useRealYouTube) {
    try {
      return await realSearch(query);
    } catch (err) {
      // Fall back to the mock dataset if the API errors out.
      console.warn('[youtube] real search failed, using mock:', err);
      return mockSearch(query);
    }
  }
  await delay(420);
  return mockSearch(query);
}
