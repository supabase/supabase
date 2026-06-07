import { bff, consoleFetch, consoleGet } from '@/lib/console-bff'

type Keys = {
  anonKey?: string
  serviceRoleKey?: string
  publishableKey?: string
  secretKey?: string
}

function legacy(id: string, name: string, api_key: string, description: string) {
  return {
    id,
    type: 'legacy' as const,
    name,
    api_key,
    prefix: '',
    description,
    hash: '',
    inserted_at: null,
    updated_at: null,
  }
}

function newKey(type: 'publishable' | 'secret', name: string, api_key: string) {
  return {
    id: `${type}_default`,
    type,
    name,
    api_key,
    prefix: api_key.slice(0, type === 'publishable' ? 15 : 9),
    description: null,
    hash: api_key,
    inserted_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
}

function buildList(d: Keys) {
  const list: any[] = [
    legacy('anon', 'anon', d.anonKey ?? '', 'Legacy anon (public) key'),
    legacy('service_role', 'service_role', d.serviceRoleKey ?? '', 'Legacy service_role (secret) key'),
  ]
  if (d.publishableKey) list.push(newKey('publishable', 'default', d.publishableKey))
  if (d.secretKey) list.push(newKey('secret', 'default', d.secretKey))
  return list
}

// [console fork] New + legacy API keys for a project. GET lists all; POST creates the
// default publishable/secret keys (derived from the JWT secret; backend re-applies the
// stack so kong accepts them).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<Keys>(req, `/api/v1/projects/${ref}/api-keys`)
    return res.status(200).json(buildList(data ?? {}))
  },
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const type: 'publishable' | 'secret' = (req.body?.type as any) === 'secret' ? 'secret' : 'publishable'
    const name = String(req.body?.name ?? 'default')
    const { ok, status, data } = await consoleFetch<Keys>(req, `/api/v1/projects/${ref}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to create API key' } })
    }
    const key = type === 'secret' ? data?.secretKey : data?.publishableKey
    return res.status(201).json(newKey(type, name, key ?? ''))
  },
})
