import { bff } from '@/lib/console-bff'

// [console fork] Removing a compute add-on isn't applicable on self-host (the smallest
// tier is the floor). Ack so the UI doesn't error.
export default bff({
  DELETE: async (_req, res) => res.status(200).json({ ok: true }),
})
