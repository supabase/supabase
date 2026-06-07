import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Delete an S3 access key via the project's Storage API.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }
  const ref = String(req.query.ref ?? '')
  const id = String(req.query.id ?? '')
  const dp = await getProjectDataPlane(req, ref)
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })

  try {
    const r = await fetch(`${dp.baseUrl}/storage/v1/credentials/${id}`, {
      method: 'DELETE',
      headers: { apikey: dp.serviceKey, Authorization: `Bearer ${dp.serviceKey}` },
    })
    if (!r.ok) {
      const body = await r.json().catch(() => ({}))
      return res
        .status(r.status >= 400 ? r.status : 502)
        .json({ error: { message: (body as any)?.message ?? 'Failed to delete S3 access key' } })
    }
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(502).json({ error: { message: e?.message ?? 'Storage credentials error' } })
  }
}
