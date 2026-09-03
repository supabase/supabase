import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web'

import { env } from './src/env.ts'
import { abortOnClientDisconnect } from './client-disconnect.ts'
import worker from './index.ts'

const PORT = env.port

function toRequest(req: IncomingMessage, abort: AbortSignal): Request {
  const host = req.headers.host ?? `127.0.0.1:${PORT}`
  const url = `http://${host}${req.url ?? '/'}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
    } else {
      headers.set(key, value)
    }
  }

  const method = req.method ?? 'GET'
  const canHaveBody = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'

  if (!canHaveBody) {
    return new Request(url, { method, headers, signal: abort })
  }

  return new Request(url, {
    method,
    headers,
    body: Readable.toWeb(req) as globalThis.ReadableStream<Uint8Array>,
    signal: abort,
    duplex: 'half',
  } as RequestInit)
}

async function writeResponse(res: ServerResponse, response: Response) {
  const headers: Record<string, string | string[]> = {}
  response.headers.forEach((value, key) => {
    const existing = headers[key]
    if (existing === undefined) {
      headers[key] = value
    } else if (Array.isArray(existing)) {
      existing.push(value)
    } else {
      headers[key] = [existing, value]
    }
  })

  res.writeHead(response.status, response.statusText, headers)

  if (!response.body) {
    res.end()
    return
  }

  await pipeline(Readable.fromWeb(response.body as NodeWebReadableStream<Uint8Array>), res)
}

const server = createServer((req, res) => {
  const abort = new AbortController()
  abortOnClientDisconnect(req, res, abort)

  void (async () => {
    try {
      const request = toRequest(req, abort.signal)
      const response = await worker.fetch(request)
      await writeResponse(res, response)
    } catch (error) {
      console.error(error)
      if (!res.headersSent) {
        res.writeHead(500, { 'content-type': 'application/json' })
      }
      if (!res.writableEnded) {
        res.end(JSON.stringify({ code: 'internal', message: 'Something went wrong. Try again.' }))
      }
    }
  })()
})

server.listen(PORT, () => {
  console.log(`Assistant API worker listening on http://localhost:${PORT}`)
})
