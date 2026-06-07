import { bff } from '@/lib/console-bff'

// [console fork] No network bans on shared infra.
export default bff({
  POST: async (_req, res) => res.status(200).json({ banned_ipv4_addresses: [] }),
  GET: async (_req, res) => res.status(200).json({ banned_ipv4_addresses: [] }),
})
