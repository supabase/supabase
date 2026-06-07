import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Preview branches for a project. GET lists branches (the parent as
// the default "main" branch + child preview branches); POST creates a branch (a
// child project seeded from the parent). Proxied to our control-plane.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/branches`, {
      method: 'GET',
    })
    return res.status(status && status >= 200 ? status : 200).json(data ?? [])
  },
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/branches`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.message ?? 'Failed to create branch' })
    }
    return res.status(201).json(data ?? {})
  },
})
