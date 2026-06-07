import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Update / delete a single GitHub connection. Proxied to the
// control-plane (both return 204 No Content).
export default bff({
  PATCH: async (req, res) => {
    const id = String(req.query.connection_id ?? '')
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/integrations/github/connections/${id}`,
      { method: 'PATCH', body: JSON.stringify(req.body ?? {}) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to update connection' })
    }
    return res.status(200).json({})
  },
  DELETE: async (req, res) => {
    const id = String(req.query.connection_id ?? '')
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/integrations/github/connections/${id}`,
      { method: 'DELETE' }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to delete connection' })
    }
    return res.status(200).json({})
  },
})
