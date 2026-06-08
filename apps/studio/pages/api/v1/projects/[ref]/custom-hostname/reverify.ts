import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Re-check DNS for a custom hostname (does it resolve to the instance IP?).
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/projects/${ref}/custom-hostname/reverify`,
      { method: 'POST' }
    )
    if (!ok) {
      const message =
        (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to verify custom hostname'
      return res.status(status && status >= 400 ? status : 502).json({ message })
    }
    return res.status(200).json({ data, status: (data as any)?.status ?? 200 })
  },
})
