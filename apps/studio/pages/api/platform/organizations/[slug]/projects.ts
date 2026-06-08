import { bff, consoleGet, mapProjectStatus, type BackendOrg } from '@/lib/console-bff'

// [console fork] GET /platform/organizations/{slug}/projects.
// Resolves slug -> orgId via better-auth, then lists our control-plane projects
// for that org and maps them into the dashboard's OrganizationProjectsResponse.
export default bff({
  GET: async (req, res) => {
    const slug = String(req.query.slug ?? '')
    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const org = (Array.isArray(orgs) ? orgs : []).find((o) => o.slug === slug)
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const { data } = await consoleGet<{ projects: any[] }>(
      req,
      `/api/v1/organizations/${org.id}/projects`
    )
    const list = Array.isArray(data?.projects) ? data.projects : []
    const limit = Number(req.query.limit ?? 96)
    const offset = Number(req.query.offset ?? 0)

    return res.status(200).json({
      pagination: { count: list.length, limit, offset },
      projects: list.map((p) => {
        const region = p.region ?? 'shared'
        const cloud_provider = p.cloudProvider ?? 'AWS'
        // Compute size only applies to dedicated (EC2) projects; shared infra has none
        // (don't fall back to 'micro' — that mislabels every project).
        const infra_compute_size =
          p.infrastructureType === 'shared' ? undefined : (p.computeSize ?? 'medium')
        const status = mapProjectStatus(p.status)
        return {
          id: p.id,
          ref: p.ref,
          name: p.name,
          status,
          organization_id: org.id,
          organization_slug: org.slug,
          cloud_provider,
          region,
          inserted_at: p.createdAt ?? p.inserted_at ?? null,
          infra_compute_size,
          databases: [{ identifier: p.ref, cloud_provider, region, status, infra_compute_size }],
        }
      }),
    })
  },
})
