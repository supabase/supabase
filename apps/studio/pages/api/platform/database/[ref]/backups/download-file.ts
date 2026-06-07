import type { NextApiRequest, NextApiResponse } from 'next'

import { CONSOLE_API_URL } from '@/lib/console-bff'

// [console fork] Stream a logical backup's .dump from the control-plane to the
// browser (same-origin so the session cookie is forwarded cleanly).
export const config = { api: { responseLimit: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const id = String(req.query.id ?? '')
  const upstream = await fetch(`${CONSOLE_API_URL}/api/v1/projects/${ref}/backups/${id}/download`, {
    headers: {
      Origin: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8082',
      ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
    },
  })
  if (!upstream.ok || !upstream.body) {
    return res.status(upstream.status || 502).json({ error: { message: 'Failed to download backup' } })
  }
  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${ref}-${id}.dump"`)
  const buf = Buffer.from(await upstream.arrayBuffer())
  return res.status(200).send(buf)
}
