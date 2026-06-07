import {
  bff,
  consoleFetch,
  consoleGet,
  mapProjectStatus,
  resolveOrg,
  type BackendOrg,
} from '@/lib/console-bff'

function mapProject(p: any, org: { id: string; slug: string }) {
  const region = p.region ?? 'shared'
  const cloud_provider = p.cloudProvider ?? 'AWS'
  const infra_compute_size = p.infraComputeSize ?? 'micro'
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
    // The dashboard reads project.databases (e.g. getComputeSize); always provide
    // the primary database entry (identifier === ref).
    databases: [{ identifier: p.ref, cloud_provider, region, status, infra_compute_size }],
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
          // Map the dashboard region label to our backend region id.
          region: b.db_region === 'Shared Infrastructure' ? 'shared' : (b.db_region || 'shared'),
          dbPassword: b.db_pass,
          postgresType: b.postgres_engine === 'oriole' ? 'orioledb' : 'postgres',
          // [console fork] honor the create-form Data API + RLS toggles
          dataApiEnabled: b.data_api_use_api_schema ?? true,
          autoExposeNewTables: b.data_api_use_api_schema ?? true,
          autoEnableRls: b.use_rls ?? b.enable_rls ?? true,
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
