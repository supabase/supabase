import { bff } from '@/lib/console-bff'

// [console fork] Deferred / served by the per-project Studio container.
export default bff({
  GET: async (_req, res) => res.status(404).json({ error: { message: 'Not available' } }),
})
