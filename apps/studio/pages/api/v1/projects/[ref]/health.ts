import { bff, consoleGet } from '@/lib/console-bff'

// [console fork] GET /v1/projects/{ref}/health?services=auth,rest,... -> per-service
// health. Derive from our control-plane project status (active => healthy).
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const requested = String(req.query.services ?? 'auth,realtime,rest,storage,db')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { data: project } = await consoleGet<any>(req, `/api/v1/projects/${ref}`)
    const active = project?.status === 'active' || project?.status === 'ACTIVE_HEALTHY'
    const status = active ? 'ACTIVE_HEALTHY' : project?.status === 'provisioning' ? 'COMING_UP' : 'UNHEALTHY'

    const INFO: Record<string, any> = {
      auth: { name: 'GoTrue', version: '', description: 'Auth' },
      rest: { name: 'PostgREST', version: '', description: 'REST' },
      realtime: { name: 'Realtime', version: '', description: 'Realtime' },
      storage: { name: 'Storage', version: '', description: 'Storage' },
      db: { healthy: active },
    }

    return res.status(200).json(
      requested.map((name) => ({
        name,
        healthy: active,
        status,
        info: INFO[name],
      }))
    )
  },
})
