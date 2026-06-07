import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Project ↔ GitHub repo connection (self-host deploy pipeline).
// Proxies to the control-plane. GET current connection / PUT set repo+branch / DELETE.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/github/connection`, {
      method: 'GET',
    })
    return res.status(status && status >= 200 ? status : 200).json(data ?? { connected: false })
  },
  PUT: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/github/connection`, {
      method: 'PUT',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to connect repository' } })
    }
    return res.status(200).json(data)
  },
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/github/connection`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to disconnect' } })
    }
    return res.status(200).json(data ?? { connected: false })
  },
})
