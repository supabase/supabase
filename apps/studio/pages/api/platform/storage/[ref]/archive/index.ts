import { bff } from '@/lib/console-bff'

// [console fork] Storage archive status. Not modeled on shared infra.
export default bff({
  GET: async (_req, res) => res.status(200).json({ data: null }),
})
