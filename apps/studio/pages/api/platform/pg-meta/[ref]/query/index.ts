import { bff } from '@/lib/console-bff'

// [console fork] Direct SQL runs against the per-project Studio/pg-meta container.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
  POST: async (_req, res) => res.status(200).json([]),
})
