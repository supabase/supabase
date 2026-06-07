import { bff, consoleGet, consoleFetch } from '@/lib/console-bff'

// [console fork] Compute add-ons. For dedicated projects, POST a compute_instance
// variant resizes the EC2 instance via the control-plane.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/billing/addons`)
    return res.status(200).json(data ?? { selected_addons: [], available_addons: [] })
  },
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/billing/addons`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to update compute' })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
