import { bff } from '@/lib/console-bff'

// [console fork] Projects use legacy HS256 JWTs; no JWKS signing-key rotation yet.
export default bff({
  GET: async (_req, res) => res.status(200).json({ keys: [] }),
})
