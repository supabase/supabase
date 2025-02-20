import pg, { Pool } from 'pg'
import { randomUUID } from 'crypto'
import { parse as parseArray } from 'postgres-array'

// Those types override are in sync with `postgres-meta` since the queries
// will get executed via `execQuery` on a pg connection with the same configuration
// see: https://github.com/supabase/postgres-meta/blob/ca06061b4708971628134f95e49f254c2dfdfa7d/src/lib/db.ts#L6-L23
pg.types.setTypeParser(pg.types.builtins.INT8, (x) => {
  const asNumber = Number(x)
  if (Number.isSafeInteger(asNumber)) {
    return asNumber
  } else {
    return x
  }
})
pg.types.setTypeParser(pg.types.builtins.DATE, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INTERVAL, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (x) => x)
pg.types.setTypeParser(1115, parseArray) // _timestamp
pg.types.setTypeParser(1182, parseArray) // _date
pg.types.setTypeParser(1185, parseArray) // _timestamptz
pg.types.setTypeParser(600, (x) => x) // point
pg.types.setTypeParser(1017, (x) => x) // _point

const ROOT_DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432'
const ROOT_DB_NAME = process.env.DATABASE_NAME ?? 'postgres'

// Replace postgres.js root connection with pg connection
const rootPool = new Pool({
  connectionString: `${ROOT_DB_URL}/${ROOT_DB_NAME}`,
  max: 1,
})

export async function createTestDatabase() {
  const dbName = `test_${randomUUID().replace(/-/g, '_')}`

  try {
    await rootPool.query(`CREATE DATABASE ${dbName};`)

    const pool = new Pool({
      connectionString: `${ROOT_DB_URL}/${dbName}`,
      max: 1,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    })

    return {
      dbName,
      client: 'pg' as const,
      executeQuery: async <T = any>(query: string): Promise<T> => {
        try {
          const res = await pool.query(query)
          return res.rows as T
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to execute query: ${error.message}`)
          }
          throw error
        }
      },
      cleanup: async () => {
        await pool.end()
        await rootPool.query(`DROP DATABASE ${dbName};`)
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create test database: ${error.message}`)
    }
    throw error
  }
}

// Update cleanup function to use pg pool
export async function cleanupRoot() {
  await rootPool.end()
}
