import { NextApiRequest, NextApiResponse } from 'next'

// [console fork] GET /platform/projects/{ref}/daily-stats
// Supabase sources these usage metrics (egress/ingress/request counts) from its
// billing/usage pipeline, which self-host doesn't run. Return a correctly-shaped
// zero series across the requested window so the report/usage charts render a flat
// "no data" line instead of erroring (was 404 -> "Unable to load data").

function formatFor(attr: string): string {
  if (attr.includes('egress') || attr.includes('ingress') || attr.includes('bytes')) return 'bytes'
  return 'number'
}

function buildTimestamps(start: string, end: string): string[] {
  const s = Date.parse(start)
  const e = Date.parse(end || '')
  const end2 = Number.isFinite(e) ? e : Date.now()
  if (!Number.isFinite(s) || end2 <= s) return [new Date(end2).toISOString()]
  const out: string[] = []
  // Daily buckets (these are *daily* stats).
  for (let t = s; t <= end2 && out.length < 400; t += 86_400_000) out.push(new Date(t).toISOString())
  return out
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }
  const attribute = String(req.query.attribute ?? '')
  if (!attribute) {
    return res.status(400).json({ error: { message: 'attribute is required' } })
  }
  const timestamps = buildTimestamps(String(req.query.startDate ?? ''), String(req.query.endDate ?? ''))
  return res.status(200).json({
    format: formatFor(attribute),
    total: 0,
    totalAverage: 0,
    yAxisLimit: 1,
    data: timestamps.map((period_start) => ({ period_start, [attribute]: '0' })),
  })
}
