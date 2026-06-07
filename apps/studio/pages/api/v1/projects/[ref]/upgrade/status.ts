import { bff } from '@/lib/console-bff'

// [console fork] Managed Postgres version upgrades aren't offered on self-host.
// Return "no upgrade in progress" so the project pages' polling stays quiet.
export default bff({
  GET: async (_req, res) => res.status(200).json({ databaseUpgradeStatus: null }),
})
