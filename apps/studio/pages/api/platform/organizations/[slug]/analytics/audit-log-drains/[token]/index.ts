import { bff, consoleFetch, resolveOrg } from '@/lib/console-bff'

// [console fork] Update / delete a single audit-log drain.
export default bff({
  PUT: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const token = String(req.query.token ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/organizations/${org.id}/audit-log-drains/${token}`, {
      method: 'PUT',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to update drain' })
    }
    return res.status(200).json(data ?? {})
  },
  DELETE: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const token = String(req.query.token ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/organizations/${org.id}/audit-log-drains/${token}`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to delete drain' })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
