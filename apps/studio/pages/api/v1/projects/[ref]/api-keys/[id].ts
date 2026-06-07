import { bff } from '@/lib/console-bff'

// [console fork] Legacy keys are immutable here.
export default bff({
  DELETE: async (_req, res) => res.status(200).json({ ok: true }),
})
