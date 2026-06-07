import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Restart the whole project stack (shared: docker compose restart;
// EC2: reboot the instance). Proxied to the control-plane.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/restart`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to restart project' })
    }
    return res.status(200).json(data ?? {})
  },
})
