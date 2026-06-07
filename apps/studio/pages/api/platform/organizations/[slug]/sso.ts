import { bff, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/sso -> our SSO providers.
// The dashboard expects a single config (or null when none configured).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const { data } = await consoleGet<any>(req, `/api/v1/organizations/${org.id}/sso`)
    const providers = Array.isArray(data) ? data : (data?.providers ?? [])
    const provider = providers[0]
    if (!provider) return res.status(200).json(null)

    return res.status(200).json({
      id: provider.id ?? provider.providerId,
      saml: provider.saml ?? null,
      domains: provider.domains ?? [],
      created_at: provider.createdAt ?? null,
    })
  },
})
