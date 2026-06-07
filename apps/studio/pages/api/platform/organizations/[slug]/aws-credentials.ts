import { bff, consoleFetch, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] Per-org AWS credentials (BYO-AWS) -> our control-plane
// /api/v1/organizations/:orgId/aws-credentials (owner/admin only, STS-validated).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const { data, status } = await consoleGet(req, `/api/v1/organizations/${org.id}/aws-credentials`)
    return res.status(status && status >= 400 ? status : 200).json(data ?? {})
  },

  POST: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const { accessKeyId, secretAccessKey, defaultRegion } = req.body ?? {}
    const { data, ok, status } = await consoleFetch(
      req,
      `/api/v1/organizations/${org.id}/aws-credentials`,
      { method: 'POST', body: JSON.stringify({ accessKeyId, secretAccessKey, defaultRegion }) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to save AWS credentials' } })
    }
    return res.status(200).json(data)
  },

  DELETE: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/organizations/${org.id}/aws-credentials`,
      { method: 'DELETE' }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to remove AWS credentials' } })
    }
    return res.status(200).json({ ok: true })
  },
})
