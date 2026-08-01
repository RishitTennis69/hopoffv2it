import { badRequest, jsonResponse, serverError, serviceUnavailable } from './proxyUtils';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,24}$/;

function youtubeKey() {
  return process.env.YOUTUBE_API_KEY?.trim() ?? '';
}

function parseIds(raw: string | null) {
  const ids = (raw ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .filter((id) => VIDEO_ID_RE.test(id));
  return [...new Set(ids)].slice(0, 50);
}

async function fetchYouTube(path: string, params: Record<string, string>) {
  const key = youtubeKey();
  if (!key) return null;

  const url = new URL(`${YOUTUBE_BASE_URL}/${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set('key', key);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[youtube-proxy] upstream failed', response.status, body.slice(0, 300));
    throw new Error('YouTube upstream failed');
  }

  return response.json();
}

export async function searchItems(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length < 2) return badRequest('Missing search query');
    if (!youtubeKey()) return serviceUnavailable();

    const data = await fetchYouTube('search', {
      part: 'snippet',
      type: 'video',
      videoDuration: 'short',
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      maxResults: '25',
      q: q.slice(0, 120),
    });

    return jsonResponse({ items: Array.isArray(data?.items) ? data.items : [] });
  } catch (error) {
    return serverError(error, 'youtube search');
  }
}

export async function details(request: Request) {
  try {
    const ids = parseIds(new URL(request.url).searchParams.get('ids'));
    if (!ids.length) return badRequest('Missing video ids');
    if (!youtubeKey()) return serviceUnavailable();

    const data = await fetchYouTube('videos', {
      part: 'contentDetails',
      id: ids.join(','),
      maxResults: '50',
    });

    return jsonResponse({ items: Array.isArray(data?.items) ? data.items : [] });
  } catch (error) {
    return serverError(error, 'youtube details');
  }
}

export async function metadata(request: Request) {
  try {
    const ids = parseIds(new URL(request.url).searchParams.get('ids'));
    if (!ids.length) return badRequest('Missing video ids');
    if (!youtubeKey()) return serviceUnavailable();

    const data = await fetchYouTube('videos', {
      part: 'snippet,contentDetails',
      id: ids.join(','),
      maxResults: '50',
    });

    return jsonResponse({ items: Array.isArray(data?.items) ? data.items : [] });
  } catch (error) {
    return serverError(error, 'youtube metadata');
  }
}

