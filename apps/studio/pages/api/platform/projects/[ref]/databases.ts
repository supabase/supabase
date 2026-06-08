import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /platform/projects/{ref}/databases -> the project's primary
// database (no read replicas on shared infra), built from our connection info.
// Powers the Connect dialog's direct/pooler connection strings.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    const conn = project?.connection ?? {}
    const host = conn.host ?? 'localhost'
    const port = conn.dbPort ?? project?.dbPort

    if (!port) return res.status(200).json([])

    return res.status(200).json([
      {
        identifier: ref,
        cloud_provider: 'AWS',
        region: project?.region ?? 'shared',
        status: 'ACTIVE_HEALTHY',
        db_host: host,
        db_port: port,
        db_user: 'postgres',
        db_name: 'postgres',
        connectionString: `postgresql://postgres:[YOUR-PASSWORD]@${host}:${port}/postgres`,
        inserted_at: project?.createdAt ?? null,
        // Real compute size for dedicated (EC2); shared infra has none.
        size: project?.infrastructureType === 'shared' ? undefined : (project?.computeSize ?? 'medium'),
      },
    ])
  },
})
