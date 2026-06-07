import { bff, consoleFetch } from '@/lib/console-bff'

// [console fork] Transfer a project to another org -> backend transfer.
export default bff({
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch<any>(req, `/api/v1/projects/${ref}/transfer`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ error: { message: (data as any)?.message ?? 'Failed to transfer project' } })
    }
    return res.status(200).json(data)
  },
})
