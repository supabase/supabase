import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Realtime configuration (reads/writes the project's _realtime.tenants
// row; applies live). Proxied to the control-plane.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/config/realtime`, {
      method: 'GET',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to load realtime config' })
    }
    return res.status(200).json(data ?? {})
  },
  PATCH: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/config/realtime`, {
      method: 'PATCH',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to update realtime config' })
    }
    return res.status(200).json(data ?? {})
  },
})
