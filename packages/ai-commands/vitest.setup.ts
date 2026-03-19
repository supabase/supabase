import { statSync } from 'fs'
import { config } from 'dotenv'

import './test/extensions'

if (!process.env.CI) {
  // Use keys from studio .env.local for local tests
  const envPath = '../../apps/studio/.env.local'

  statSync(envPath)
  config({ path: envPath })
}

// Modify fetch to support wasm file URLs
globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
  if (input instanceof Request) {
    return fetch(input, init)
  }

  const url = new URL(input)
  if (url.protocol === 'file:' && url.pathname.endsWith('.wasm')) {
    return fetchFileNode(input, 'application/wasm')
  }

  return fetch(input, init)
}

async function fetchFileNode(input: string | URL, type: string) {
  const fs = await import('node:fs')
  const { Readable } = await import('node:stream')
  const { fileURLToPath } = await import('node:url')
  const path = fileURLToPath(input)
  const nodeStream = fs.createReadStream(path)
  const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
  return new Response(stream, { headers: { 'Content-Type': type } })
}
