import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Reset a preview branch — re-seed its database from the parent.
export default bff({
  POST: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/branches/${id}/reset`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to reset branch' })
    }
    return res.status(200).json(data ?? {})
  },
})
