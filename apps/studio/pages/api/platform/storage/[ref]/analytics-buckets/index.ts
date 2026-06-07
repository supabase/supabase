import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Per-project Analytics (Iceberg) buckets via the project's running
// storage-api data plane. Analytics buckets are standard storage buckets created
// with `type: 'ANALYTICS'`. Self-host: no plan gate. If the project's storage image
// predates Iceberg support we degrade gracefully (empty list / clear error) so the
// page still renders the dashboard UI.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const dp = await getProjectDataPlane(req, ref)
  if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })

  const headers = {
    apikey: dp.serviceKey,
    Authorization: `Bearer ${dp.serviceKey}`,
    'Content-Type': 'application/json',
  }

  if (req.method === 'GET') {
    try {
      const upstream = await fetch(`${dp.baseUrl}/storage/v1/bucket`, { headers })
      if (!upstream.ok) return res.status(200).json({ data: [] })
      const buckets = (await upstream.json()) as any[]
      const analytics = (Array.isArray(buckets) ? buckets : []).filter(
        (b) => b?.type === 'ANALYTICS'
      )
      return res.status(200).json({ data: analytics })
    } catch {
      return res.status(200).json({ data: [] })
    }
  }

  if (req.method === 'POST') {
    const { bucketName } = req.body ?? {}
    if (!bucketName) return res.status(400).json({ error: { message: 'Bucket name is required' } })
    try {
      const upstream = await fetch(`${dp.baseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: bucketName, name: bucketName, type: 'ANALYTICS' }),
      })
      const body = await upstream.json().catch(() => ({}))
      if (!upstream.ok) {
        return res
          .status(upstream.status === 404 ? 400 : upstream.status)
          .json({ error: { message: body?.message ?? 'Analytics buckets are not supported by this project’s storage version.' } })
      }
      return res.status(200).json(body)
    } catch (err: any) {
      return res.status(400).json({ error: { message: err?.message ?? 'Failed to create analytics bucket' } })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
}
