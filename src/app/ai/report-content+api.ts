import { checkRateLimit, optionsResponse } from '../../server/proxyUtils';
import { reportContent } from '../../server/reportContentProxy';

export function OPTIONS() {
  return optionsResponse();
}

export function POST(request: Request) {
  const limited = checkRateLimit(request, { bucket: 'report', limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  return reportContent(request);
}

