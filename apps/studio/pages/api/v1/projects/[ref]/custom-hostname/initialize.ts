import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Initialize a custom hostname — stores it + returns the DNS record to add.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/projects/${ref}/custom-hostname/initialize`,
      { method: 'POST', body: JSON.stringify(req.body ?? {}) }
    )
    if (!ok) {
      const message =
        (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to set up custom hostname'
      return res.status(status && status >= 400 ? status : 502).json({ message })
    }
    return res.status(200).json({ data, status: (data as any)?.status ?? 200 })
  },
})
