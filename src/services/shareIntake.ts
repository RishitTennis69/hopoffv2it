import type { VideoClip } from '@/store/types';

// ---------------------------------------------------------------------------
// Share-sheet intake — receives clips shared from TikTok / Instagram / YouTube.
//
// Android: expo-share-intent registers HopOff in the system share sheet.
// No Instagram/TikTok API keys — the OS passes us the shared URL.
// ---------------------------------------------------------------------------

function guessPlatform(url: string): 'tiktok' | 'instagram' | 'youtube' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return 'other';
}

function youtubeIdFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    return u.searchParams.get('v') ?? undefined;
  } catch {
    return undefined;
  }
}

function defaultTitle(url: string, platform: ReturnType<typeof guessPlatform>): string {
  if (platform === 'tiktok') return 'Saved from TikTok';
  if (platform === 'instagram') return 'Saved from Instagram';
  if (platform === 'youtube') return 'Saved from YouTube';
  return 'Saved link';
}

/** Turn a shared URL into a library clip (may start as pending). */
export function clipFromSharedUrl(url: string, metaTitle?: string | null): VideoClip {
  const platform = guessPlatform(url);
  const ytId = platform === 'youtube' ? youtubeIdFromUrl(url) : undefined;
  return {
    id: ytId ?? `share-${Date.now()}`,
    source: ytId ? 'youtube' : 'share',
    youtubeId: ytId,
    url: ytId ? undefined : url,
    title: metaTitle?.trim() || defaultTitle(url, platform),
    author: platform === 'other' ? 'shared link' : platform,
    durationSec: 30,
    pending: !ytId,
    thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined,
  };
}

/** Add a shared URL to the library (resolves pending metadata when possible). */
export async function ingestSharedUrl(url: string, metaTitle?: string | null): Promise<VideoClip> {
  const clip = clipFromSharedUrl(url, metaTitle);
  return resolveSharedClip(clip);
}

/** Still used by the in-app ShareNote demo row on non-native builds. */
export function simulateShare(platform: 'tiktok' | 'instagram'): VideoClip {
  return clipFromSharedUrl(
    platform === 'tiktok'
      ? 'https://www.tiktok.com/@demo/video/123'
      : 'https://www.instagram.com/reel/demo/',
  );
}

export async function resolveSharedClip(clip: VideoClip): Promise<VideoClip> {
  // YouTube clips already have an id/thumbnail; TikTok/Instagram keep the URL.
  await new Promise((r) => setTimeout(r, 400));
  return { ...clip, pending: false };
}
