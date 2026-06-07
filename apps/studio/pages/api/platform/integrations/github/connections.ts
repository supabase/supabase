import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] GitHub repo <-> project connections. GET lists an org's
// connections; POST links a repo to a project. Proxied to the control-plane.
export default bff({
  GET: async (req, res) => {
    const orgId = String(req.query.organization_id ?? '')
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/integrations/github/connections?organization_id=${encodeURIComponent(orgId)}`,
      { method: 'GET' }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to list connections', connections: [] })
    }
    return res.status(200).json(data ?? { connections: [] })
  },
  POST: async (req, res) => {
    const { ok, status, data } = await consoleFetch(req, `/api/v1/integrations/github/connections`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to create connection' })
    }
    return res.status(201).json(data ?? {})
  },
})
