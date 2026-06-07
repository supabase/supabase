import { bff } from '@/lib/console-bff'

// [console fork] Feedback is removed; accept and discard to avoid client errors.
export default bff({
  POST: async (_req, res) => res.status(200).json({ result: 'ok' }),
})
