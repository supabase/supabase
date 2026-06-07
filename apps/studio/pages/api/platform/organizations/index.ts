import { bff, consoleFetch, consoleGet, mapOrganization, type BackendOrg } from '@/lib/console-bff'

// [console fork] /platform/organizations -> better-auth org plugin (mapped).
export default bff({
  GET: async (req, res) => {
    const [{ data: orgs }, { data: profile }] = await Promise.all([
      consoleGet<BackendOrg[]>(req, '/api/auth/organization/list'),
      consoleGet(req, '/api/v1/account/profile'),
    ])
    const billingEmail = profile?.email ?? 'billing@example.com'
    const list = Array.isArray(orgs) ? orgs : []
    return res.status(200).json(list.map((o) => mapOrganization(o, billingEmail)))
  },

  // Create org -> better-auth organization/create.
  POST: async (req, res) => {
    const { name, slug } = req.body ?? {}
    const { data, status, ok } = await consoleFetch<BackendOrg>(
      req,
      '/api/auth/organization/create',
      { method: 'POST', body: JSON.stringify({ name, slug }) }
    )
    if (!ok || !data) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to create organization' } })
    }
    const { data: profile } = await consoleGet(req, '/api/v1/account/profile')
    return res.status(201).json(mapOrganization(data, profile?.email ?? 'billing@example.com'))
  },
})
