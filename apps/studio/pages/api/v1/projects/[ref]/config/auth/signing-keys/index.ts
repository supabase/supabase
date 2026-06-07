import { bff, consoleGet } from '@/lib/console-bff'

type SigningInfo = {
  current?: { kid: string; algorithm: string; public_jwk?: unknown; created_at?: string } | null
  legacy?: { kid: string; algorithm: string; created_at?: string } | null
}

// Stable uuid-format id from a key id (kid) so the dashboard can key rows.
function uuidFromKid(kid: string): string {
  const h = (kid + 'abcdef0123456789abcdef0123456789').replace(/[^0-9a-f]/gi, '0').toLowerCase().slice(0, 32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

// [console fork] List the project's JWT signing keys: the asymmetric ES256 key in
// use + the legacy HS256 shared secret (still used to verify older tokens).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<SigningInfo>(req, `/api/v1/projects/${ref}/signing-keys`)
    const now = new Date().toISOString()
    const keys: any[] = []
    if (data?.current) {
      keys.push({
        id: uuidFromKid(data.current.kid),
        algorithm: 'ES256',
        status: 'in_use',
        public_jwk: data.current.public_jwk,
        created_at: data.current.created_at ?? now,
        updated_at: data.current.created_at ?? now,
      })
    }
    if (data?.legacy) {
      keys.push({
        id: uuidFromKid(data.legacy.kid),
        algorithm: 'HS256',
        status: 'previously_used',
        created_at: data.legacy.created_at ?? now,
        updated_at: data.legacy.created_at ?? now,
      })
    }
    return res.status(200).json({ keys })
  },
  // [console fork] Standby-key creation / rotation isn't available on self-host: the
  // project's ES256 signing key is derived deterministically from its JWT secret, so
  // there's a single in-use key (plus the legacy HS256 verifier). Return a clear
  // message instead of a raw error.
  POST: async (_req, res) =>
    res.status(400).json({
      message:
        'Standby keys and rotation are not available on self-host — this project uses a fixed ES256 signing key derived from its JWT secret (with the legacy HS256 key for verification).',
    }),
})
