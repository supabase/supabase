import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /v1/projects/{ref}/api-keys -> our /api/v1/projects/:ref/api-keys.
// Our backend issues legacy HS256 JWTs (anon + service_role); map them to the
// management-API api-keys array shape the dashboard renders.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<{ anonKey?: string; serviceRoleKey?: string }>(
      req,
      `/api/v1/projects/${ref}/api-keys`
    )
    const keys = [
      {
        id: 'anon',
        type: 'legacy',
        name: 'anon',
        api_key: data?.anonKey ?? '',
        prefix: '',
        description: 'Legacy anon (public) key',
        hash: '',
        inserted_at: null,
        updated_at: null,
      },
      {
        id: 'service_role',
        type: 'legacy',
        name: 'service_role',
        api_key: data?.serviceRoleKey ?? '',
        prefix: '',
        description: 'Legacy service_role (secret) key',
        hash: '',
        inserted_at: null,
        updated_at: null,
      },
    ]
    return res.status(200).json(keys)
  },
})
