import { bff } from '@/lib/console-bff'

// [console fork] Telemetry identify is a no-op (no external analytics).
export default bff({
  POST: async (_req, res) => res.status(200).json({}),
  GET: async (_req, res) => res.status(200).json({}),
})
