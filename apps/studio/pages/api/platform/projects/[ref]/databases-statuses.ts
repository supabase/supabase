import { bff } from '@/lib/console-bff'

// [console fork] Status of the project's databases (primary only on shared infra).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    return res.status(200).json([{ identifier: ref, status: 'ACTIVE_HEALTHY' }])
  },
})
