import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] Pause/restore progress — derived from the project's status.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    return res.status(200).json({ status: data?.status ?? 'ACTIVE_HEALTHY' })
  },
})
