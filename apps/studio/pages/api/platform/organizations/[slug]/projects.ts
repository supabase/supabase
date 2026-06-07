import { bff, consoleGet, type BackendOrg } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/projects.
// Resolves slug -> orgId via better-auth, then lists our control-plane projects
// for that org and maps them into the dashboard's OrganizationProjectsResponse.
export default bff({
  GET: async (req, res) => {
    const slug = String(req.query.slug ?? '')
    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const org = (Array.isArray(orgs) ? orgs : []).find((o) => o.slug === slug)
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const { data: projects } = await consoleGet<any[]>(
      req,
      `/api/v1/organizations/${org.id}/projects`
    )
    const list = Array.isArray(projects) ? projects : []
    const limit = Number(req.query.limit ?? 96)
    const offset = Number(req.query.offset ?? 0)

    return res.status(200).json({
      pagination: { count: list.length, limit, offset },
      projects: list.map((p) => ({
        id: p.id,
        ref: p.ref,
        name: p.name,
        status: p.status ?? 'ACTIVE_HEALTHY',
        organization_id: org.id,
        organization_slug: org.slug,
        cloud_provider: p.cloudProvider ?? 'AWS',
        region: p.region ?? 'local',
        inserted_at: p.createdAt ?? p.inserted_at ?? null,
        infra_compute_size: p.infraComputeSize ?? 'micro',
      })),
    })
  },
})
