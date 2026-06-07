import { bff, consoleGet, getProjectDataPlane, resolveOrg } from '@/lib/console-bff'

// [console fork] Real org usage pipeline: computes total Database + Storage size
// live across the org's running projects (via each project's pg-meta) and returns a
// daily series in the platform's OrgDailyUsageResponse shape. No external telemetry
// daemon needed — values are sampled per request.

async function queryScalar(baseUrl: string, serviceKey: string, sql: string): Promise<number> {
  try {
    const r = await fetch(`${baseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    if (!r.ok) return 0
    const rows = (await r.json()) as Array<Record<string, any>>
    const v = rows?.[0] ? Object.values(rows[0])[0] : 0
    return Number(v) || 0
  } catch {
    return 0
  }
}

function daysBetween(start: string, end: string): string[] {
  const s = Date.parse(start)
  const e = Date.parse(end)
  const out: string[] = []
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) {
    return [new Date(Number.isFinite(e) ? e : Date.now()).toISOString().slice(0, 10)]
  }
  for (let t = s; t <= e && out.length < 120; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10))
  }
  return out
}

export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ usages: [] })

    const selectedRef = req.query.projectRef ? String(req.query.projectRef) : null
    const { data: list } = await consoleGet<any>(req, `/api/v1/organizations/${org.id}/projects`)
    const projects = (list?.projects ?? []).filter(
      (p: any) => p?.status === 'active' && (!selectedRef || p.ref === selectedRef)
    )

    let dbSize = 0
    let storageSize = 0
    for (const p of projects) {
      const dp = await getProjectDataPlane(req, p.ref)
      if (!dp) continue
      dbSize += await queryScalar(dp.baseUrl, dp.serviceKey, 'select pg_database_size(current_database())')
      storageSize += await queryScalar(
        dp.baseUrl,
        dp.serviceKey,
        "select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects"
      )
    }

    const days = daysBetween(
      String(req.query.startDate ?? new Date(Date.now() - 7 * 86_400_000).toISOString()),
      String(req.query.endDate ?? new Date().toISOString())
    )

    const usages = days.flatMap((date) => [
      { metric: 'DATABASE_SIZE', date, usage: dbSize, usage_original: dbSize, pricing_strategy: 'NONE' },
      { metric: 'STORAGE_SIZE', date, usage: storageSize, usage_original: storageSize, pricing_strategy: 'NONE' },
    ])

    return res.status(200).json({ usages })
  },
})
