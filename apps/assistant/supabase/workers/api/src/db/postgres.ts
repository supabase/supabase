import { Pool, type QueryResultRow } from 'pg'

import { env } from '../env.ts'

let pool: Pool | undefined

function getAdminPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.supabaseDbUrl, max: 4 })
  }
  return pool
}

/** Direct Postgres for `private` RPCs. Do not expose those functions on PostgREST. */
export async function adminQuery<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const { rows } = await getAdminPool().query<T>(text, values)
  return rows
}
