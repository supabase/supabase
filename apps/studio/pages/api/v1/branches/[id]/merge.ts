import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Merge a preview branch into production — applies the branch's
// tracked Git-branch migrations to the parent project. Proxied to the control-plane.
export default bff({
  POST: async (req, res) => {
    const id = String(req.query.id ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/branches/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to merge branch' })
    }
    return res.status(200).json(data ?? {})
  },
})
