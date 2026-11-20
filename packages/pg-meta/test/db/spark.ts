import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CatalogQuery } from '../../src/catalog-fallback'

/** A Spark binary to run the catalog fallbacks against; their Spark tests skip without it. */
export const SPARK_BIN = process.env.SPARK_BIN

// Spark's demo service_role key for its default local JWT secret.
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() =>
        typeof address === 'object' && address
          ? resolve(address.port)
          : reject(new Error('no port'))
      )
    })
  })

/** Error thrown by `query`, carrying Spark's SQLSTATE as `code` like a Postgres error does. */
export class SparkQueryError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined
  ) {
    super(message)
  }
}

/**
 * Starts `SPARK_BIN` on a new project whose only migration is `migration`, and returns a query
 * function over Spark's admin query API.
 */
export async function startSpark(migration: string) {
  if (!SPARK_BIN) throw new Error('SPARK_BIN is not set')
  const root = await mkdtemp(join(tmpdir(), 'pg-meta-spark-'))
  const port = await freePort()
  await mkdir(join(root, 'supabase', 'migrations'), { recursive: true })
  await writeFile(
    join(root, 'supabase', 'config.toml'),
    `project_id = "pg-meta-fallbacks"\n[api]\nport = ${port}\n`
  )
  await writeFile(join(root, 'supabase', 'migrations', '20260101000000_init.sql'), migration)

  const child = spawn(SPARK_BIN, ['--workdir', root, 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))

  const url = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 30_000
  for (;;) {
    if (child.exitCode !== null) throw new Error(`spark exited before serving:\n${output}`)
    const healthy = await fetch(`${url}/auth/v1/health`, { headers: { apikey: SERVICE_ROLE_KEY } })
      .then((response) => response.ok)
      .catch(() => false)
    if (healthy) break
    if (Date.now() > deadline) {
      child.kill('SIGKILL')
      throw new Error(`spark did not serve ${url} within 30s:\n${output}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const query: CatalogQuery = async (sql) => {
    const response = await fetch(`${url}/_spark/v1/query`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: sql, parameters: [], read_only: false }),
    })
    const body = await response.json()
    if (!response.ok) throw new SparkQueryError(body.message, body.code ?? undefined)
    return body
  }

  const stop = async () => {
    child.kill('SIGTERM')
    await exited
    await rm(root, { recursive: true, force: true })
  }

  return { query, stop }
}
