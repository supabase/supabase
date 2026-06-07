import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

// [console fork] /platform/profile/access-tokens -> apiKey plugin (/api/v1/account/access-tokens).
function mapToken(t: any) {
  return {
    id: t.id,
    name: t.name,
    token_alias: [t.prefix, t.start].filter(Boolean).join('') || '••••••',
    scope: t.type === 'experimental' ? 'V0' : null,
    created_at: t.createdAt ?? t.created_at,
    expires_at: t.expiresAt ?? null,
  }
}

export default bff({
  GET: async (req, res) => {
    const { data } = await consoleGet<any[]>(req, '/api/v1/account/access-tokens')
    return res.status(200).json((Array.isArray(data) ? data : []).map(mapToken))
  },

  POST: async (req, res) => {
    const { name, scope, expires_at } = req.body ?? {}
    // Map dashboard's expires_at -> our expiresInDays; scope -> our token type.
    let expiresInDays = 30
    if (expires_at) {
      const ms = new Date(expires_at).getTime() - Date.now()
      if (Number.isFinite(ms) && ms > 0) expiresInDays = Math.max(1, Math.ceil(ms / 86400000))
    }
    const type = scope === 'V0' ? 'experimental' : 'classic'

    const { data, ok, status } = await consoleFetch<any>(req, '/api/v1/account/access-tokens', {
      method: 'POST',
      body: JSON.stringify({ name, expiresInDays, type }),
    })
    if (!ok || !data) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to create token' } })
    }
    return res.status(201).json({
      id: data.id,
      name: data.name,
      // raw token, shown once
      token: data.token,
      token_alias: data.token ? String(data.token).slice(0, 12) : undefined,
      scope: type === 'experimental' ? 'V0' : null,
      created_at: new Date().toISOString(),
      expires_at: data.expiresAt ?? null,
    })
  },
})
