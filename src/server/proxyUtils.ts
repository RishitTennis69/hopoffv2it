type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function allowedOrigin() {
  return process.env.HOPOFF_ALLOWED_ORIGIN ?? 'https://hopoffv2it.expo.app';
}

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': allowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type, X-HopOff-Client, X-HopOff-Platform',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export function optionsResponse() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function badRequest(message = 'Bad request') {
  return jsonResponse({ error: message }, 400);
}

export function serviceUnavailable() {
  return jsonResponse({ error: 'Service unavailable' }, 503);
}

export function tooManyRequests(retryAfterSec: number) {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      ...JSON_HEADERS,
      'Retry-After': String(Math.max(1, Math.ceil(retryAfterSec))),
    },
  });
}

export function serverError(error: unknown, label: string) {
  console.error(`[proxy] ${label}`, error);
  return jsonResponse({ error: 'Internal server error' }, 500);
}

export async function readJsonBody(request: Request, maxBytes = 12_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new Error('Request body too large');
  }
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export function asString(value: unknown, max = 500) {
  return typeof value === 'string' ? value.slice(0, max).trim() : '';
}

export function asStringArray(value: unknown, maxItems = 20, maxLength = 200) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.slice(0, maxLength).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function cleanOneLine(value: string, max = 180) {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function requestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ??
    forwarded ??
    request.headers.get('x-real-ip') ??
    'unknown-ip'
  );
}

function clientKey(request: Request) {
  const client = request.headers.get('x-hopoff-client')?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return client || requestIp(request);
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.bucket}:${clientKey(request)}:${requestIp(request)}`;
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    return tooManyRequests((current.resetAt - now) / 1000);
  }

  current.count += 1;
  return null;
}
