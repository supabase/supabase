import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

function uuidFromKid(kid: string): string {
  const h = (kid + 'abcdef0123456789abcdef0123456789').replace(/[^0-9a-f]/gi, '0').toLowerCase().slice(0, 32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

// Map the dashboard's uuid id back to the backend key id (kid).
async function resolveKid(req: any, ref: string, id: string): Promise<string | null> {
  const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/signing-keys`)
  const all = [data?.current, ...(data?.standby ?? []), data?.legacy].filter(Boolean)
  const match = all.find((k: any) => uuidFromKid(k.kid) === id)
  return match?.kid ?? null
}

// [console fork] Per-key signing-key ops: PATCH status (e.g. move to previously used /
// promote to in use) and DELETE (revoke). Operate on operator-created standby keys.
export default bff({
  PATCH: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const id = String(req.query.id ?? '')
    const kid = await resolveKid(req, ref, id)
    if (!kid) return res.status(404).json({ message: 'Signing key not found' })
    const { ok, status, data } = await consoleFetch<any>(
      req,
      `/api/v1/projects/${ref}/signing-keys/${kid}`,
      { method: 'PATCH', body: JSON.stringify({ status: req.body?.status }) }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to update signing key' })
    }
    return res.status(200).json({ id, status: req.body?.status })
  },
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const id = String(req.query.id ?? '')
    const kid = await resolveKid(req, ref, id)
    if (!kid) return res.status(404).json({ message: 'Signing key not found' })
    const { ok, status, data } = await consoleFetch<any>(
      req,
      `/api/v1/projects/${ref}/signing-keys/${kid}`,
      { method: 'DELETE' }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to revoke signing key' })
    }
    return res.status(200).json({ id })
  },
})
