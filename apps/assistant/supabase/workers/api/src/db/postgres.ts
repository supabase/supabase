import { AsyncLocalStorage } from 'node:async_hooks'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'

import { describeDbHost, env } from '../env.ts'

let pool: Pool | undefined
const transactions = new AsyncLocalStorage<PoolClient>()

function getAdminPool(): Pool {
  if (!pool) {
    const connectionString = env.supabaseDbUrl
    console.log(`assistant db pool connecting to ${describeDbHost(connectionString)}`)
    pool = new Pool({
      connectionString,
      max: 4,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
      query_timeout: 20000,
    })
  }
  return pool
}

/** Direct Postgres for `private` RPCs. Do not expose those functions on PostgREST. */
export async function adminQuery<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const { rows } = await (transactions.getStore() ?? getAdminPool()).query<T>(text, values)
  return rows
}

export async function adminTransaction<T>(
  work: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await getAdminPool().connect()
  try {
    await client.query('begin')
    await client.query("set local statement_timeout = '15s'")
    await client.query("set local lock_timeout = '5s'")
    const result = await transactions.run(client, () => work(client))
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

export async function withAdvisoryLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  return adminTransaction(async (client) => {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [key])
    return work()
  })
}
