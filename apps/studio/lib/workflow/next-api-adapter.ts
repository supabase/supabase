import type { NextApiRequest, NextApiResponse } from 'next'

export const apiRouteConfig = {
  api: { bodyParser: false },
}

type DuplexRequestInit = RequestInit & { duplex?: 'half' }

export function normalizeNextApiRequest(req: NextApiRequest) {
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'undefined') continue
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else {
      headers.append(key, value)
    }
  }

  const url = req.url?.startsWith('http') ? req.url : `http://localhost${req.url ?? ''}`
  const init: DuplexRequestInit = { method: req.method, headers }

  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req as any
    init.duplex = 'half'
  }

  return new Request(url, init)
}

export async function sendResponse(res: NextApiResponse, response: Response) {
  res.status(response.status)
  response.headers.forEach((value, key) => res.setHeader(key, value))
  const body = await response.arrayBuffer()
  res.send(Buffer.from(body))
}
