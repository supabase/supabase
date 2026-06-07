import { bff } from '@/lib/console-bff'

// [console fork] Org daily usage stats. Empty until usage collection is wired.
export default bff({
  GET: async (_req, res) => res.status(200).json({ usages: [] }),
})
