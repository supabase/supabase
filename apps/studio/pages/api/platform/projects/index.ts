import { bff, consoleGet, type BackendOrg } from '@/lib/console-bff'

// [console fork] GET /platform/projects -> all projects across the user's orgs,
// in the dashboard's paginated shape (used by the command-menu project switcher).
export default bff({
  GET: async (req, res) => {
    const limit = Number(req.query.limit ?? 96)
    const offset = Number(req.query.offset ?? 0)

    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const orgList = Array.isArray(orgs) ? orgs : []

    const perOrg = await Promise.all(
      orgList.map(async (org) => {
        const { data } = await consoleGet<any[]>(req, `/api/v1/organizations/${org.id}/projects`)
        return (Array.isArray(data) ? data : []).map((p) => ({
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
        }))
      })
    )
    const projects = perOrg.flat()

    return res.status(200).json({
      pagination: { count: projects.length, limit, offset },
      projects: projects.slice(offset, offset + limit),
    })
  },
})
