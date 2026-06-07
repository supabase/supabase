import { bff, consoleFetch, resolveOrg } from '@/lib/console-bff'

// [console fork] Send a test event to a drain's webhook.
export default bff({
  POST: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ message: 'Organization not found' })
    const token = String(req.query.token ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/organizations/${org.id}/audit-log-drains/${token}/test`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Drain test failed' })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
