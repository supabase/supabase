import { bff } from '@/lib/console-bff'

// [console fork] No read replicas to remove on shared infrastructure.
export default bff({
  POST: async (_req, res) => res.status(200).json({ ok: true }),
})
