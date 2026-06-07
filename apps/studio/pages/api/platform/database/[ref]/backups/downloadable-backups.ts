import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] Logical backups available to download/restore. Proxies the
// control-plane backups list.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/backups`)
    return res.status(200).json({ backups: data?.backups ?? [] })
  },
})
