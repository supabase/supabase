import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Proxy S3 access keys to the project's Storage API
// ({kong}/storage/v1/credentials) using the service role key.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const dp = await getProjectDataPlane(req, ref)
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })

  const url = `${dp.baseUrl}/storage/v1/credentials`
  const headers = {
    'Content-Type': 'application/json',
    apikey: dp.serviceKey,
    Authorization: `Bearer ${dp.serviceKey}`,
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(url, { headers })
      const body = await r.json().catch(() => [])
      if (!r.ok) return res.status(200).json({ data: [] })
      return res.status(200).json({ data: Array.isArray(body) ? body : ((body as any)?.data ?? []) })
    }
    if (req.method === 'POST') {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(req.body ?? {}) })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) {
        return res
          .status(r.status >= 400 ? r.status : 502)
          .json({ error: { message: (body as any)?.message ?? 'Failed to create S3 access key' } })
      }
      return res.status(200).json(body)
    }
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  } catch (e: any) {
    return res.status(502).json({ error: { message: e?.message ?? 'Storage credentials error' } })
  }
}
