import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Apply the connected GitHub repo's supabase/migrations to the
// project DB now. Proxies to the control-plane deploy endpoint.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/github/deploy`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Deploy failed' } })
    }
    return res.status(200).json(data)
  },
})
