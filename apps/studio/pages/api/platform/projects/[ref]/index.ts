import { bff, consoleGet, type BackendOrg } from '@/lib/console-bff'

// Map our control-plane project status -> dashboard project status enum.
const STATUS_MAP: Record<string, string> = {
  provisioning: 'COMING_UP',
  active: 'ACTIVE_HEALTHY',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  failed: 'INIT_FAILED',
  paused: 'INACTIVE',
  pausing: 'PAUSING',
  resuming: 'RESTORING',
  removed: 'REMOVED',
}

// [console fork] GET /platform/projects/{ref} -> our /api/v1/projects/:ref (mapped).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data: p, status } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    if (!p) {
      return res
        .status(status && status >= 400 ? status : 404)
        .json({ error: { message: 'Project not found' } })
    }

    const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
    const org = (Array.isArray(orgs) ? orgs : []).find((o) => o.id === p.organizationId)

    return res.status(200).json({
      id: p.id,
      ref: p.ref,
      name: p.name,
      organization_id: p.organizationId,
      organization_slug: org?.slug,
      cloud_provider: 'AWS',
      region: p.region ?? 'shared',
      status: STATUS_MAP[p.status] ?? 'UNKNOWN',
      infra_compute_size: p.infraComputeSize ?? 'micro',
      inserted_at: p.createdAt ?? p.inserted_at ?? null,
      postgres_engine: p.postgresType ?? 'postgres',
      db_host: p.connection?.host ?? null,
      restUrl: p.connection?.apiUrl ?? null,
    })
  },
})
