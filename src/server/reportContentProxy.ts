import {
  asString,
  badRequest,
  jsonResponse,
  readJsonBody,
  serverError,
} from './proxyUtils';

type ContentReport = {
  id: string;
  source: string;
  content: string;
  reason: string;
  createdAt: string;
};

function webhookUrl() {
  const raw = process.env.HOPOFF_REPORT_WEBHOOK_URL?.trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function parseReport(body: unknown): ContentReport | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  const id = asString(value.id, 80);
  const source = asString(value.source, 80);
  const content = asString(value.content, 1000);
  const reason = asString(value.reason, 80);
  const createdAt = asString(value.createdAt, 40);

  if (!id || !source || !content || !reason || !createdAt) return null;
  return { id, source, content, reason, createdAt };
}

async function forwardReport(report: ContentReport) {
  const url = webhookUrl();
  if (!url) {
    console.warn('[report-content] accepted without HOPOFF_REPORT_WEBHOOK_URL', {
      id: report.id,
      source: report.source,
      reason: report.reason,
      createdAt: report.createdAt,
    });
    return;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'ai_content_report',
      app: 'HopOff',
      report,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[report-content] webhook failed', response.status, body.slice(0, 300));
    throw new Error('Report webhook failed');
  }
}

export async function reportContent(request: Request) {
  try {
    const body = await readJsonBody(request, 4_000);
    const report = parseReport(body);
    if (!report) return badRequest('Invalid report');

    await forwardReport(report);
    return jsonResponse({ status: 'received' }, 202);
  } catch (error) {
    return serverError(error, 'report content');
  }
}

