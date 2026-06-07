import { bff, consoleGet, consoleFetch, resolveOrg } from '@/lib/console-bff'

// [console fork] Audit-log drains for an org (webhook backend). Proxies the
// control-plane (resolves slug -> org id).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const { data } = await consoleGet<any>(req, `/api/v1/organizations/${org.id}/audit-log-drains`)
    return res.status(200).json(data ?? [])
  },
  POST: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const { ok, status, data } = await consoleFetch(req, `/api/v1/organizations/${org.id}/audit-log-drains`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to create drain' })
    }
    return res.status(201).json(data ?? {})
  },
})
