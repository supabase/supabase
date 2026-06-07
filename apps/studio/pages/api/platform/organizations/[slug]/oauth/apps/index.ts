import { bff, consoleGet, resolveOrg } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/oauth/apps?type=published|authorized
//   -> our /api/v1/organizations/:orgId/oauth-apps (+ /authorized).
export default bff({
  GET: async (req, res) => {
    const org = await resolveOrg(req, String(req.query.slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const type = String(req.query.type ?? 'published')
    const path =
      type === 'authorized'
        ? `/api/v1/organizations/${org.id}/oauth-apps/authorized`
        : `/api/v1/organizations/${org.id}/oauth-apps`
    const { data } = await consoleGet<any[]>(req, path)
    return res.status(200).json(Array.isArray(data) ? data : [])
  },
})
