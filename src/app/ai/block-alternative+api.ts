import { checkRateLimit, optionsResponse } from '../../server/proxyUtils';
import { blockAlternative } from '../../server/openRouterProxy';

export function OPTIONS() {
  return optionsResponse();
}

export function POST(request: Request) {
  const limited = checkRateLimit(request, { bucket: 'ai', limit: 25, windowMs: 60_000 });
  if (limited) return limited;
  return blockAlternative(request);
}
