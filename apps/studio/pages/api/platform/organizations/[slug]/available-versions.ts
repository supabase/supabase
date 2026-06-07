import { bff } from '@/lib/console-bff'

// [console fork] Postgres version upgrades not modeled yet; return none.
export default bff({
  GET: async (_req, res) => res.status(200).json({ available_versions: [] }),
})
