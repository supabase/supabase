import { bff } from '@/lib/console-bff'

// [console fork] No server-side notifications to archive; ack so the UI clears.
export default bff({
  PATCH: async (_req, res) => res.status(200).json({}),
})
