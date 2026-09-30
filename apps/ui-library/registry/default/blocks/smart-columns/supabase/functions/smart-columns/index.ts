import postgres from 'npm:postgres@3.4.7'

import { model, tables } from './config.ts'
import { drain, evaluateWithJev } from './worker.ts'

export async function isAuthorized(request: Request, secret: string): Promise<boolean> {
  if (secret.length < 32) return false
  const digest = (value: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const [actual, expected] = await Promise.all([
    digest(request.headers.get('Authorization') ?? ''),
    digest(`Bearer ${secret}`),
  ])
  const a = new Uint8Array(actual)
  const b = new Uint8Array(expected)
  return a.reduce((difference, byte, index) => difference | (byte ^ b[index]), 0) === 0
}

// Created once so warm invocations reuse their connections.
let sql: ReturnType<typeof postgres> | undefined

if (import.meta.main)
  Deno.serve(async (request) => {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    if (!(await isAuthorized(request, Deno.env.get('SMART_COLUMNS_SECRET') ?? ''))) {
      return new Response('Unauthorized', { status: 401 })
    }
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL')
    const apiKey = Deno.env.get('TYPESAFE_API_KEY')
    if (!databaseUrl || !apiKey)
      return new Response('Missing worker configuration', { status: 503 })

    sql ??= postgres(databaseUrl, { prepare: false, max: 8, connect_timeout: 10, idle_timeout: 20 })
    try {
      // The request carries no table names, row contents, or instructions.
      const processed = await drain(sql, tables, model, (jevRequest) =>
        evaluateWithJev(apiKey, jevRequest)
      )
      return Response.json({ processed })
    } catch {
      console.error(
        'Smart Columns worker failed. Check the database connection and applied migration.'
      )
      return new Response('Worker failed; pending rows will be retried', { status: 500 })
    }
  })
