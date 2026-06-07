import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /platform/projects/{ref}/settings -> project app_config
// (endpoint + protocol, used to build the Project URL) and service api keys,
// derived from our control-plane project connection + api-keys.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const [{ data: project }, { data: keys }] = await Promise.all([
      consoleGet<any>(req, `/api/v1/projects/${ref}`),
      consoleGet<{ anonKey?: string; serviceRoleKey?: string }>(
        req,
        `/api/v1/projects/${ref}/api-keys`
      ),
    ])
    const conn = project?.connection ?? {}
    const port = conn.kongHttpPort ?? project?.kongHttpPort
    const host = conn.host ?? 'localhost'
    const endpoint = port ? `${host}:${port}` : undefined

    return res.status(200).json({
      id: project?.id,
      ref,
      name: project?.name,
      // Top-level DB connection fields used by the Connect dialog's direct string.
      db_host: host,
      db_port: conn.dbPort ?? project?.dbPort ?? 5432,
      db_user: 'postgres',
      db_name: 'postgres',
      inserted_at: project?.createdAt ?? null,
      app_config: endpoint
        ? { endpoint, protocol: 'http', db_schema: 'public', storage_endpoint: endpoint }
        : undefined,
      service_api_keys: [
        { name: 'anon key', api_key: keys?.anonKey ?? '', tags: 'anon' },
        { name: 'service_role key', api_key: keys?.serviceRoleKey ?? '', tags: 'service_role' },
      ],
      cloud_provider: 'AWS',
      region: project?.region ?? 'shared',
      status: project?.status,
    })
  },
})
