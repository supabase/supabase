import { bff, consoleFetch, resolveOrg } from '@/lib/console-bff'

// [console fork] Store an org GitHub Personal Access Token (used by the deploy
// pipeline to read private repos). Self-host alternative to the OAuth App flow.
export default bff({
  PUT: async (req, res) => {
    const slug = String(req.query.slug ?? '')
    const org = await resolveOrg(req, slug)
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })
    const { ok, status, data } = await consoleFetch(
      req,
      `/api/v1/organizations/${org.id}/integrations/github`,
      {
        method: 'POST',
        body: JSON.stringify({
          githubLogin: req.body?.githubLogin ?? 'token',
          accessToken: req.body?.accessToken ?? '',
        }),
      }
    )
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to save token' } })
    }
    return res.status(200).json(data ?? { connected: true })
  },
})
