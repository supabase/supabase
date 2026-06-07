import { bff } from '@/lib/console-bff'

// [console fork] No separate PgBouncer pooler config on shared infra.
export default bff({
  GET: async (_req, res) =>
    res.status(200).json({ pgbouncer_enabled: false, pool_mode: 'transaction' }),
})
