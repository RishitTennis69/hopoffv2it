import type { SharedVideoPlatform, VideoClip } from '@/store/types';

// ---------------------------------------------------------------------------
// Share-sheet intake — receives clips shared from TikTok / Instagram / YouTube.
//
// Android: expo-share-intent registers HopOff in the system share sheet.
// No Instagram/TikTok API keys — the OS passes us the shared URL.
// ---------------------------------------------------------------------------

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  provider_name?: string;
  thumbnail_url?: string;
  duration?: number | string;
  duration_ms?: number | string;
};

const ALLOWED_HOSTS = new Set([
  'www.tiktok.com',
  'vm.tiktok.com',
  'www.instagram.com',
  'instagram.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
]);

function parseAllowedUrl(raw: string): URL | undefined {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:') return undefined;
    const hostname = url.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(hostname)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function guessPlatform(url: string): SharedVideoPlatform {
  const parsed = parseAllowedUrl(url);
  if (!parsed) return 'other';
  const host = parsed.hostname.toLowerCase();
  if (host === 'www.tiktok.com' || host === 'vm.tiktok.com') return 'tiktok';
  if (host === 'www.instagram.com' || host === 'instagram.com') return 'instagram';
  if (host === 'www.youtube.com' || host === 'youtube.com' || host === 'youtu.be') return 'youtube';
  return 'other';
}

function youtubeIdFromUrl(url: string): string | undefined {
  const u = parseAllowedUrl(url);
  if (!u) return undefined;
  const host = u.hostname.toLowerCase();
  const id = host === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : u.searchParams.get('v') ?? undefined;
  return id && /^[\w-]{6,20}$/.test(id) ? id : undefined;
}

function defaultTitle(url: string, platform: SharedVideoPlatform): string {
  if (platform === 'tiktok') return 'Saved from TikTok';
  if (platform === 'instagram') return 'Saved from Instagram';
  if (platform === 'youtube') return 'Saved from YouTube';
  return 'Saved link';
}

function stableShareId(url: string) {
  const parsed = parseAllowedUrl(url);
  return `share-${(parsed?.toString() ?? url.trim()).toLowerCase()}`;
}

function durationFromOEmbed(data: OEmbedResponse): number | undefined {
  const raw = data.duration ?? data.duration_ms;
  if (raw == null) return undefined;
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n > 1000 ? Math.round(n / 1000) : Math.round(n);
}

function cleanTitle(title: string | undefined, fallback: string) {
  const stripped = title?.replace(/\s+/g, ' ').trim();
  return stripped || fallback;
}

function tiktokVideoIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1];
}

async function fetchJson(url: string): Promise<OEmbedResponse | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HopOff/1.0',
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as OEmbedResponse;
  } catch (err) {
    console.warn('[shareIntake] oEmbed fetch failed:', err);
    return null;
  }
}

async function fetchSharedOEmbed(url: string, platform: SharedVideoPlatform): Promise<OEmbedResponse | null> {
  if (!parseAllowedUrl(url)) return null;
  const encoded = encodeURIComponent(url);
  if (platform === 'tiktok') {
    return fetchJson(`https://www.tiktok.com/oembed?url=${encoded}`);
  }
  if (platform === 'instagram') {
    return (
      (await fetchJson(`https://graph.facebook.com/v25.0/instagram_oembed?url=${encoded}`)) ??
      (await fetchJson(`https://www.instagram.com/oembed/?url=${encoded}`))
    );
  }
  return null;
}

function tiktokPlayerHtml(videoId: string) {
  if (!/^\d{5,32}$/.test(videoId)) return undefined;
  return `<iframe src="https://www.tiktok.com/player/v1/${videoId}?autoplay=1&controls=0&loop=0&music_info=0&description=0&progress_bar=0&fullscreen_button=0" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>`;
}

function providerEmbedHtml(url: string, platform: SharedVideoPlatform, meta?: OEmbedResponse | null) {
  if (!parseAllowedUrl(url)) return undefined;
  if (platform === 'tiktok') {
    const videoId = tiktokVideoIdFromUrl(url);
    if (videoId) return tiktokPlayerHtml(videoId);
  }
  return fallbackEmbedHtml(url, platform);
}

function fallbackEmbedHtml(url: string, platform: SharedVideoPlatform) {
  if (!parseAllowedUrl(url)) return undefined;
  const escaped = url.replace(/"/g, '&quot;');
  if (platform === 'tiktok') {
    return `<blockquote class="tiktok-embed" cite="${escaped}" data-video-id="" style="max-width: 605px;min-width: 280px;"><section><a target="_blank" href="${escaped}">View on TikTok</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
  }
  if (platform === 'instagram') {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${escaped}" data-instgrm-version="14"></blockquote><script async src="https://www.instagram.com/embed.js"></script>`;
  }
  return undefined;
}

/** Turn a shared URL into a library clip (may start as pending). */
export function clipFromSharedUrl(url: string, metaTitle?: string | null): VideoClip {
  const platform = guessPlatform(url);
  const ytId = platform === 'youtube' ? youtubeIdFromUrl(url) : undefined;
  const safeUrl = parseAllowedUrl(url)?.toString();
  return {
    id: ytId ?? stableShareId(url),
    platform,
    source: ytId ? 'youtube' : 'share',
    youtubeId: ytId,
    url: ytId ? undefined : safeUrl,
    title: metaTitle?.trim() || defaultTitle(url, platform),
    author: platform === 'other' ? 'shared link' : platform,
    durationSec: 30,
    pending: !ytId,
    thumbnail: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined,
  };
}

/** Add a shared URL to the library (resolves pending metadata when possible). */
export async function ingestSharedUrl(url: string, metaTitle?: string | null): Promise<VideoClip> {
  if (!parseAllowedUrl(url)) {
    return clipFromSharedUrl('', metaTitle);
  }
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
  if (clip.source !== 'share' || !clip.url) return { ...clip, pending: false };

  const platform = clip.platform ?? guessPlatform(clip.url);
  const meta = await fetchSharedOEmbed(clip.url, platform);
  const fallbackTitleText = defaultTitle(clip.url, platform);
  const durationSec = meta ? durationFromOEmbed(meta) : undefined;

  return {
    ...clip,
    id: stableShareId(clip.url),
    platform,
    title: cleanTitle(meta?.title, clip.title || fallbackTitleText),
    author: cleanTitle(meta?.author_name ?? meta?.provider_name, platform === 'other' ? 'shared link' : platform),
    durationSec: durationSec ?? clip.durationSec,
    thumbnail: meta?.thumbnail_url ?? clip.thumbnail,
    embedHtml: providerEmbedHtml(clip.url, platform, meta),
    pending: false,
  };
}
