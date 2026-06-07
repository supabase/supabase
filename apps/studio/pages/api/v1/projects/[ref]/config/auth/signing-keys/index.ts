import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

type StandbyKey = {
  kid: string
  algorithm: string
  status: string
  public_jwk?: unknown
  created_at?: string
}
type SigningInfo = {
  current?: { kid: string; algorithm: string; public_jwk?: unknown; created_at?: string } | null
  legacy?: { kid: string; algorithm: string; created_at?: string } | null
  standby?: StandbyKey[]
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
    for (const sb of data?.standby ?? []) {
      keys.push({
        id: uuidFromKid(sb.kid),
        algorithm: sb.algorithm ?? 'ES256',
        status: sb.status ?? 'standby',
        public_jwk: sb.public_jwk,
        created_at: sb.created_at ?? now,
        updated_at: sb.created_at ?? now,
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
  // Create a standby ES256 signing key (the project also keeps its derived current key).
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch<any>(
      req,
      `/api/v1/projects/${ref}/signing-keys`,
      { method: 'POST', body: JSON.stringify(req.body ?? {}) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to create standby key' })
    }
    const now = new Date().toISOString()
    return res.status(201).json({
      id: uuidFromKid((data as any)?.kid ?? 'standby'),
      algorithm: (data as any)?.algorithm ?? 'ES256',
      status: (data as any)?.status ?? 'standby',
      created_at: (data as any)?.created_at ?? now,
      updated_at: (data as any)?.created_at ?? now,
    })
  },
})
