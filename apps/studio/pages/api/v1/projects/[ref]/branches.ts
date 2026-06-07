import { bff } from '@/lib/console-bff'

// [console fork] Branching (preview databases) is not offered; return none.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
