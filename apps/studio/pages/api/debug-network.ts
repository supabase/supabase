import { NextApiRequest, NextApiResponse } from 'next'
import { promises as dns } from 'dns'
import * as http from 'http'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pgMetaUrl = process.env.STUDIO_PG_META_URL ?? 'NOT SET'
  
  // Test DNS
  let dnsResult: any
  try {
    dnsResult = await dns.lookup('supabase-meta')
  } catch (e: any) {
    dnsResult = { error: e.code + ': ' + e.message }
  }

  // Test HTTP fetch
  let fetchResult: any
  try {
    const r = await fetch(`${pgMetaUrl}/health`, { signal: AbortSignal.timeout(3000) })
    fetchResult = { status: r.status, body: await r.text() }
  } catch (e: any) {
    fetchResult = { error: e.message, cause: e.cause?.code ?? e.cause?.message }
  }

  res.status(200).json({
    pgMetaUrl,
    dns: dnsResult,
    fetch: fetchResult,
    env: {
      POSTGRES_HOST: process.env.POSTGRES_HOST,
      POSTGRES_DOCKER_HOST: process.env.POSTGRES_DOCKER_HOST,
    }
  })
}
