import { bff } from '@/lib/console-bff'

// [console fork] Notifications are not modeled in the control plane yet.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
