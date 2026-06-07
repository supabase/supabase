import { bff } from '@/lib/console-bff'

// [console fork] Advisor lints not modeled yet; useLints expects a bare array.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
