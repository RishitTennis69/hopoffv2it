import { checkRateLimit, optionsResponse } from '../../server/proxyUtils';
import { searchItems } from '../../server/youtubeProxy';

export function OPTIONS() {
  return optionsResponse();
}

export function GET(request: Request) {
  const limited = checkRateLimit(request, { bucket: 'youtube', limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  return searchItems(request);
}
