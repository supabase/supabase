import { bff, consoleGet, consoleFetch } from '@/lib/console-bff'

// [console fork] Dedicated (EC2) disk = the instance's root EBS volume.
// GET reads it live from AWS; POST applies an online ModifyVolume.
export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { data, status } = await consoleGet<any>(req, `/api/v1/projects/${ref}/disk`)
    if (!data) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: 'Failed to load disk config' })
    }
    return res.status(200).json(data)
  },
  POST: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const { ok, status, data } = await consoleFetch(req, `/api/v1/projects/${ref}/disk`, {
      method: 'POST',
      body: JSON.stringify(req.body ?? {}),
    })
    if (!ok) {
      return res
        .status(status && status >= 400 ? status : 502)
        .json({ message: (data as any)?.error?.message ?? (data as any)?.message ?? 'Failed to update disk' })
    }
    return res.status(200).json(data ?? { ok: true })
  },
})
