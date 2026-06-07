import { bff, consoleFetch, consoleGet, type BackendOrg } from '@/lib/console-bff'

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
      // [console fork] shared infra has no compute tier -> undefined so the UI shows
      // "Shared Infrastructure" instead of a misleading compute size.
      infra_compute_size: p.infrastructureType === 'shared' ? undefined : (p.infraComputeSize ?? 'micro'),
      inserted_at: p.createdAt ?? p.inserted_at ?? null,
      postgres_engine: p.postgresType ?? 'postgres',
      // [console fork] our stack runs supabase/postgres 15.8 — report it so the
      // dashboard's Postgres-version gates (e.g. Restore to new project, PG15+) pass.
      dbVersion: '15.8.1.085',
      db_version: '15.8.1.085',
      db_host: p.connection?.host ?? null,
      restUrl: p.connection?.apiUrl ?? null,
      // [console fork] Preview branches: branching is always available on self-host
      // (no plan gate), so the branch selector + Branches page render. `is_branch`
      // marks a project that is itself a preview branch (has a parent).
      is_branch_enabled: true,
      is_branch: !!p.parentProjectId,
      parent_project_ref: undefined,
      // [console fork] expose the stored project toggles so the UI reflects them
      // (Data API on/off, auto-RLS + auto-expose for new tables).
      dataApiEnabled: p.dataApiEnabled ?? true,
      autoApiEnabled: p.dataApiEnabled ?? true,
      autoEnableRls: p.autoEnableRls ?? true,
      autoExposeNewTables: p.autoExposeNewTables ?? true,
      // Direct DB connection string (password is a placeholder; never exposed).
      connectionString: p.connection?.dbPort
        ? `postgresql://postgres:[YOUR-PASSWORD]@${p.connection.host ?? 'localhost'}:${p.connection.dbPort}/postgres`
        : undefined,
    })
  },

  // [console fork] DELETE /platform/projects/{ref} -> backend delete (tears down stack).
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch<any>(req, `/api/v1/projects/${ref}`, {
      method: 'DELETE',
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to delete project' } })
    }
    return res.status(200).json(data ?? { ref })
  },
})
