import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] Project members = the owning org's members (single-tenant). Proxy
// the org members so the project Members view isn't empty.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    const slug = project?.organization_slug ?? project?.organizationSlug
    if (!slug) return res.status(200).json({ members: [] })
    const { data } = await consoleGet<any>(req, `/api/v1/organizations/${slug}/members`)
    const members = (data?.members ?? data ?? []).map((m: any) => ({
      gotrue_id: m.userId ?? m.gotrue_id ?? m.id,
      user_id: m.userId ?? m.user_id,
      primary_email: m.email ?? m.primary_email,
      username: m.name ?? m.username ?? m.email,
      role_ids: [1],
    }))
    return res.status(200).json({ members })
  },
})
