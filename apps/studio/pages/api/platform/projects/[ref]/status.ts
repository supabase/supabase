import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] Project runtime status (polled widely for ACTIVE_HEALTHY gating).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    return res.status(200).json({ status: data?.status ?? 'ACTIVE_HEALTHY' })
  },
})
