import { bff, consoleGet } from '@/lib/console-bff'

function uuidFromKid(kid: string): string {
  const h = (kid + 'abcdef0123456789abcdef0123456789').replace(/[^0-9a-f]/gi, '0').toLowerCase().slice(0, 32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

// [console fork] The legacy HS256 shared secret — now a "previously used" key that
// still verifies older tokens (the project has migrated to asymmetric ES256).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<{ legacy?: { kid: string; created_at?: string } | null }>(
      req,
      `/api/v1/projects/${ref}/signing-keys`
    )
    if (!data?.legacy) return res.status(404).json({ error: { message: 'No legacy signing key' } })
    const now = new Date().toISOString()
    return res.status(200).json({
      id: uuidFromKid(data.legacy.kid),
      algorithm: 'HS256',
      status: 'previously_used',
      created_at: data.legacy.created_at ?? now,
      updated_at: data.legacy.created_at ?? now,
    })
  },
})
