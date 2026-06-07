import { bff, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/audit -> org audit logs (mapped).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const { data } = await consoleGet<{ logs: any[] }>(
      req,
      `/api/v1/organizations/${org.id}/audit-logs`
    )
    const logs = data?.logs ?? []
    const result = logs.map((l) => ({
      request_id: String(l.id),
      organization_slug: org.slug,
      action: { name: `${l.method} ${l.path}`, method: l.method, route: l.path, status: l.statusCode },
      actor: { token_type: 'user' },
      // The audit UI renders timestamp in MICROSECONDS (divides by 1000); send µs.
      timestamp: new Date(l.createdAt).getTime() * 1000,
    }))
    return res.status(200).json({ result, retention_period: 0 })
  },
})
