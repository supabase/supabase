import { bff, consoleGet, consoleFetch } from '@/lib/console-bff'

// [console fork] Custom hostname (Management API) — dedicated/EC2 only. Proxies the
// control-plane and shapes the response like the Cloudflare custom-hostname API the
// Custom Domains UI parses: it reads `data.data.result`, so we return { data: { result }, status }.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleGet<any>(req, `/api/v1/projects/${ref}/custom-hostname`)
    if (!ok) {
      const message = (data as any)?.error?.message ?? (data as any)?.message ?? 'custom hostname error'
      return res.status(status && status >= 400 ? status : 502).json({ message })
    }
    return res.status(200).json({ data, status: (data as any)?.status ?? 200 })
  },
  DELETE: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/custom-hostname`, {
      method: 'DELETE',
    })
    if (!ok) {
      const message =
        (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to remove custom hostname'
      return res.status(status && status >= 400 ? status : 502).json({ message })
    }
    return res.status(200).json({ data, status: (data as any)?.status ?? 200 })
  },
})
