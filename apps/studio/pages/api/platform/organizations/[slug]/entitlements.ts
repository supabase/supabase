import { bff } from '@/lib/console-bff'

// [console fork] No billing/entitlements in self-host: return an empty set.
export default bff({
  GET: async (_req, res) => res.status(200).json({ entitlements: [] }),
})
