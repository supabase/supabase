import { bff } from '@/lib/console-bff'

// [console fork] No Action run logs on self-host (see ../../actions.ts).
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
