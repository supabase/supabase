import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /platform/profile/audit -> /api/v1/account/audit-logs (mapped to AuditLog[]).
export default bff({
  GET: async (req, res) => {
    const [{ data }, { data: profile }] = await Promise.all([
      consoleGet<{ logs: any[] }>(req, '/api/v1/account/audit-logs'),
      consoleGet(req, '/api/v1/account/profile'),
    ])
    const logs = data?.logs ?? []
    const result = logs.map((l) => ({
      request_id: String(l.id),
      action: {
        name: `${l.method} ${l.path}`,
        method: l.method,
        route: l.path,
        status: l.statusCode,
      },
      actor: {
        token_type: 'user',
        user_id: profile?.id,
        email: profile?.email,
      },
      timestamp: new Date(l.createdAt).getTime(),
    }))
    return res.status(200).json({ result, retention_period: 0 })
  },
})
