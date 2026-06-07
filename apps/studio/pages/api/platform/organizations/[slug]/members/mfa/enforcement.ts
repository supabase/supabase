import { bff, consoleFetch, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] Org MFA enforcement -> our /api/v1/organizations/:orgId/security (mfaRequired).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const { data } = await consoleGet<any>(req, `/api/v1/organizations/${org.id}/security`)
    return res.status(200).json({ enforced: !!data?.mfaRequired })
  },

  PATCH: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const enforced = !!req.body?.enforced
    const { data, ok, status } = await consoleFetch<any>(
      req,
      `/api/v1/organizations/${org.id}/security`,
      { method: 'PUT', body: JSON.stringify({ mfaRequired: enforced }) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to update MFA enforcement' } })
    }
    return res.status(200).json({ enforced: data?.mfaRequired ?? enforced })
  },
})
