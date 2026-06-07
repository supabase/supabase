import { bff, consoleGet, consoleFetch } from '@/lib/console-bff'

// [console fork] Edge Function secrets (Management API). Proxies the control-plane,
// which stores them encrypted + writes the functions volume's .secrets.json.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/secrets`)
    return res.status(200).json(data ?? [])
  },
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/secrets`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? []),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to set secrets' })
    }
    return res.status(201).json(data ?? [])
  },
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/secrets`, {
      method: 'DELETE',
      body: JSON.stringify(req.body ?? []),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to delete secrets' })
    }
    return res.status(200).json(data ?? [])
  },
})
