import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] DELETE /platform/profile/access-tokens/{id} -> apiKey plugin.
export default bff({
  DELETE: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/account/access-tokens/${id}`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to delete token' } })
    }
    return res.status(200).json({ id })
  },
})
