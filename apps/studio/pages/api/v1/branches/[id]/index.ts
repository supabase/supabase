import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] A single preview branch (keyed by the branch's project id).
// GET / PATCH / DELETE proxied to our control-plane.
export default bff({
  GET: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { status, data } = await consoleFetch(req, `/api/v1/branches/${id}`, { method: 'GET' })
    return res.status(status && status >= 200 ? status : 200).json(data ?? {})
  },
  PATCH: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to update branch' })
    }
    return res.status(200).json(data ?? {})
  },
  DELETE: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/branches/${id}`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to delete branch' })
    }
    return res.status(200).json(data ?? { message: 'ok' })
  },
})
