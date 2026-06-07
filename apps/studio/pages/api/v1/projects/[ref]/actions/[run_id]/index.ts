import { bff } from '@/lib/console-bff'

// [console fork] No Action runs on self-host (see ../actions.ts).
export default bff({
  GET: async (_req, res) => res.status(200).json({ id: String((_req.query as any).run_id ?? ''), run_steps: [] }),
})
