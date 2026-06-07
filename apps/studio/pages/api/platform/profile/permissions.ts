import { bff, consoleGet, wildcardPermission, type BackendOrg } from '@/lib/console-bff'

// [console fork] GET /platform/profile/permissions.
// Authorization is enforced by our control-plane on every /api/v1 call. For the
// dashboard's client-side UI gating we grant the signed-in member full access
// within each org they belong to (a wildcard permission per org).
export default bff({
  GET: async (req, res) => {
    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const list = Array.isArray(orgs) ? orgs : []
    return res.status(200).json(list.map((o) => wildcardPermission(o.slug)))
  },
})
