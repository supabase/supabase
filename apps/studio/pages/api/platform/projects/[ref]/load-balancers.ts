import { bff } from '@/lib/console-bff'

// [console fork] No load balancers on shared infra.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
