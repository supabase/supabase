import { bff } from '@/lib/console-bff'

// [console fork] Notifications aren't produced server-side on self-host; return an
// empty feed so the bell renders cleanly instead of erroring.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
