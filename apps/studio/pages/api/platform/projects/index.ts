import { bff, consoleFetch, consoleGet, resolveOrg, type BackendOrg } from '@/lib/console-bff'

function mapProject(p: any, org: { id: string; slug: string }) {
  return {
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
  }
}

// [console fork] /platform/projects — list across the user's orgs (GET), create (POST).
export default bff({
  GET: async (req, res) => {
    const limit = Number(req.query.limit ?? 96)
    const offset = Number(req.query.offset ?? 0)
    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const orgList = Array.isArray(orgs) ? orgs : []

    const perOrg = await Promise.all(
      orgList.map(async (org) => {
        const { data } = await consoleGet<{ projects: any[] }>(
          req,
          `/api/v1/organizations/${org.id}/projects`
        )
        return (data?.projects ?? []).map((p) => mapProject(p, org))
      })
    )
    const projects = perOrg.flat()
    return res.status(200).json({
      pagination: { count: projects.length, limit, offset },
      projects: projects.slice(offset, offset + limit),
    })
  },

  POST: async (req, res) => {
    const b = req.body ?? {}
    const org = await resolveOrg(req, String(b.organization_slug ?? ''))
    if (!org) return res.status(404).json({ error: { message: 'Organization not found' } })

    const { data, ok, status } = await consoleFetch<any>(
      req,
      `/api/v1/organizations/${org.id}/projects`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: b.name,
          region: b.db_region || 'Shared Infrastructure',
          dbPassword: b.db_pass,
          postgresType: b.postgres_engine === 'oriole' ? 'orioledb' : 'postgres',
          dataApiEnabled: b.data_api_use_api_schema ?? true,
        }),
      }
    )
    if (!ok || !data) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to create project' } })
    }
    return res.status(201).json(mapProject(data, org))
  },
})
