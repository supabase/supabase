import { bff } from '@/lib/console-bff'

// [console fork] Global third-party integrations list (Vercel marketplace etc.) is
// not used on self-host; return empty so callers don't error.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
