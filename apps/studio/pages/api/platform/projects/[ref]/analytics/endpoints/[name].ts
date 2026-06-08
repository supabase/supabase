import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Analytics / Logs endpoints.
//
// Supabase Cloud serves these from Logflare; current self-hosting (which this stack
// mirrors) ships WITHOUT the Logflare/vector services — they were removed upstream
// because the per-project log pipeline is heavy and flaky. So there is no historical
// log-event store to query here.
//
// Previously this route only answered GET and returned a bare `[]`, so every report /
// observability block that POSTs a `logs.all` SQL query (or expects `{ result }`) got a
// 405 / wrong shape and rendered "Unable to load data for ...". This handler fixes that:
// it answers GET and POST for every `analytics/endpoints/*` name, always returns 200
// with the correctly-shaped `{ result: [...] }` (never an `error` field, which the
// report hooks throw on), and serves REAL data for the metrics we can derive from the
// project's Postgres (auth metrics). Everything log-event-based degrades to an honest
// empty series ("No data") instead of an error.

type Row = Record<string, unknown>

const ok = (res: NextApiResponse, result: Row[]) => res.status(200).json({ result, error: null })

// Run a read-only SQL statement against the project's postgres-meta `/query` endpoint.
async function runSql(
  dp: { baseUrl: string; serviceKey: string },
  query: string
): Promise<Row[] | null> {
  try {
    const upstream = await fetch(`${dp.baseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: dp.serviceKey,
        Authorization: `Bearer ${dp.serviceKey}`,
      },
      body: JSON.stringify({ query }),
    })
    if (!upstream.ok) return null
    const body = await upstream.json()
    return Array.isArray(body) ? (body as Row[]) : null
  } catch {
    return null
  }
}

// Real auth metrics derived from the project's `auth.users` table. The Auth Overview
// expects a single row per period with these exact numeric fields.
async function authMetrics(dp: { baseUrl: string; serviceKey: string }): Promise<Row[]> {
  const rows = await runSql(
    dp,
    `select
       count(*)::int as active_users,
       count(*) filter (where created_at >= now() - interval '7 days')::int as sign_up_count
     from auth.users`
  )
  const r = rows?.[0] ?? {}
  // The Auth Overview schema requires a `period` ('current'|'previous') + all numeric
  // fields on every row. We can derive active_users + sign_up_count from auth.users;
  // request/error metrics need a log pipeline we don't run, so report 0.
  const row = (period: 'current' | 'previous', activeUsers: number, signUps: number): Row => ({
    period,
    active_users: activeUsers,
    api_error_requests: 0,
    api_total_requests: 0,
    auth_total_errors: 0,
    auth_total_requests: 0,
    password_reset_requests: 0,
    sign_up_count: signUps,
  })
  return [
    row('current', Number(r.active_users ?? 0), Number(r.sign_up_count ?? 0)),
    row('previous', 0, 0),
  ]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const name = String(req.query.name ?? '')

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }

  // auth.metrics is the one block we can back with real data from the project DB.
  if (name === 'auth.metrics') {
    const dp = await getProjectDataPlane(req, ref)
    if (!dp) return ok(res, [])
    try {
      return ok(res, await authMetrics(dp))
    } catch {
      return ok(res, [])
    }
  }

  // usage.api-requests-count powers the homepage "API requests" stat — return a
  // well-formed zero so the card renders instead of erroring.
  if (name === 'usage.api-requests-count') {
    return ok(res, [{ count: 0 }])
  }

  // Everything else (logs.all, logs.all.otel, usage.api-counts, functions.*,
  // service-health, ...) has no per-project log backend in this self-host stack.
  // Return an honest empty series in the shape the charts expect.
  return ok(res, [])
}
