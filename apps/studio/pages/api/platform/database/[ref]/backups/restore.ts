import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Restore a logical backup into the project's database (pg_restore).
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const id = String(req.body?.id ?? '')
    if (!id) return res.status(400).json({ error: { message: 'Backup id is required' } })
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/projects/${ref}/backups/${id}/restore`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Restore failed' } })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
