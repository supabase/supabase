import { bff } from '@/lib/console-bff'

// [console fork] Project secrets (Edge Function env vars). Not modeled on shared infra.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
  POST: async (_req, res) => res.status(200).json([]),
})
