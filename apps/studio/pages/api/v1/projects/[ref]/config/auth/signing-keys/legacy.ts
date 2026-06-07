import { bff } from '@/lib/console-bff'

// [console fork] No legacy JWKS signing key surfaced (projects use HS256 JWTs).
export default bff({
  GET: async (_req, res) => res.status(404).json({ error: { message: 'No legacy signing key' } }),
})
