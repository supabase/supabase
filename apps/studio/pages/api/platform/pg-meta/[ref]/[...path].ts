import type { NextApiRequest, NextApiResponse } from 'next'

import { getProjectDataPlane } from '@/lib/console-bff'

// [console fork] Proxy all /platform/pg-meta/{ref}/* calls to the per-project
// postgres-meta (via the project's kong /pg/* route) using the service_role key.
// This powers the Table Editor, SQL editor, policies, etc. against the running
// project's database.
export const config = { api: { bodyParser: false } }

async function readBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const ref = String(req.query.ref ?? '')
    const segments = req.query.path
    const subPath = Array.isArray(segments) ? segments.join('/') : String(segments ?? '')

    const dp = await getProjectDataPlane(req, ref)
    if (!dp) return res.status(503).json({ error: { message: 'Project is not running' } })

    const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const target = `${dp.baseUrl}/pg/${subPath}${qs}`

    const method = req.method ?? 'GET'
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const body = hasBody ? await readBody(req) : undefined

    const upstream = await fetch(target, {
      method,
      headers: {
        'Content-Type': String(req.headers['content-type'] ?? 'application/json'),
        apikey: dp.serviceKey,
        Authorization: `Bearer ${dp.serviceKey}`,
      },
      body: body && body.length ? (body as any) : undefined,
    })

    const text = await upstream.text()
    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('content-type', ct)
    return res.send(text)
  } catch (err: any) {
    return res.status(502).json({ error: { message: err?.message ?? 'pg-meta proxy error' } })
  }
}
