import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Single scoped access token: fetch detail / revoke.
export default bff({
  GET: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/account/scoped-access-tokens/${id}`, {
      method: 'GET',
    })
    if (!ok) return res.status(status && status >= 400 ? status : 502).json({ error: { message: 'Token not found' } })
    return res.status(200).json(data ?? {})
  },
  DELETE: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/account/scoped-access-tokens/${id}`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to delete token' } })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
