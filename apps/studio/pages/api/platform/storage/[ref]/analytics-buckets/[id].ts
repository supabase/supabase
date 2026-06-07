import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Delete an Analytics (Iceberg) bucket via the project's storage-api
// data plane. Empties the bucket first since storage requires it to be empty.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const id = String(req.query.id ?? '')
  const dp = await getProjectDataPlane(req, ref)
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
  }

  const headers = {
    apikey: dp.serviceKey,
    Authorization: `Bearer ${dp.serviceKey}`,
    'Content-Type': 'application/json',
  }

  try {
    // Best-effort empty, then delete.
    await fetch(`${dp.baseUrl}/storage/v1/bucket/${encodeURIComponent(id)}/empty`, {
      method: 'POST',
      headers,
    }).catch(() => undefined)
    const upstream = await fetch(`${dp.baseUrl}/storage/v1/bucket/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    })
    const body = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      return res.status(400).json({ error: { message: body?.message ?? 'Failed to delete analytics bucket' } })
    }
    return res.status(200).json(body)
  } catch (err: any) {
    return res.status(400).json({ error: { message: err?.message ?? 'Failed to delete analytics bucket' } })
  }
}
