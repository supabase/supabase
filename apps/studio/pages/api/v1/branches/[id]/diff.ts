import { CONSOLE_API_URL } from '@/lib/console-bff'
import type { NextApiRequest, NextApiResponse } from 'next'

// [console fork] Schema diff between a preview branch and production — a unified
// diff (text/plain) of each side's public-schema DDL. Proxies the control-plane,
// forwarding the session cookie, and passes the raw text through.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).send('Method Not Allowed')
  }
  const id = String(req.query.id ?? '')
  try {
    const upstream = await fetch(`${CONSOLE_API_URL}/api/v1/branches/${id}/diff`, {
      headers: {
        Origin: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8082',
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      },
    })
    const text = await upstream.text()
    res.setHeader('Content-Type', 'text/plain')
    return res.status(upstream.ok ? 200 : upstream.status).send(text)
  } catch {
    res.setHeader('Content-Type', 'text/plain')
    return res.status(200).send('')
  }
}
