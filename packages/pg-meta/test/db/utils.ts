import postgres from 'postgres'
import pg, { Pool } from 'pg'
import { randomUUID } from 'crypto'

const numberCast = (x: any) => {
  const asNumber = Number(x)
  if (Number.isSafeInteger(asNumber)) {
    return asNumber
  } else {
    return x
  }
}

pg.types.setTypeParser(pg.types.builtins.INT8, numberCast)
pg.types.setTypeParser(pg.types.builtins.DATE, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INTERVAL, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (x) => x)
pg.types.setTypeParser(600, (x) => x) // point
pg.types.setTypeParser(1017, (x) => x) // _point

const ROOT_DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432'
const ROOT_DB_NAME = process.env.DATABASE_NAME ?? 'postgres'

// Connection to the postgres server (not a specific database)
const rootDb = postgres(`${ROOT_DB_URL}/${ROOT_DB_NAME}`)

export type DbClient = 'postgres' | 'pg'

export async function createTestDatabase(client: DbClient = 'postgres') {
  const dbName = `test_${randomUUID().replace(/-/g, '_')}`

  try {
    // Create a new database for this test
    await rootDb.unsafe(`CREATE DATABASE ${dbName};`)

    if (client === 'postgres') {
      // Create a new connection to the test database using postgres.js
      const testDb = postgres(`${ROOT_DB_URL}/${dbName}`, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      })

      return {
        dbName,
        client: 'postgres' as const,
        executeQuery: async <T = any>(query: string): Promise<T> => {
          try {
            const execResult = await testDb.unsafe(query)
            const result = execResult.map((v) => v)
            return result as T
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`Failed to execute query: ${error.message}`)
            }
            throw error
          }
        },
        cleanup: async () => {
          await testDb.end()
          await rootDb.unsafe(`DROP DATABASE ${dbName};`)
        },
      }
    } else {
      // Create a new connection to the test database using node-postgres
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
            console.log('query: ', query)
            const res = await pool.query(query)
            console.log('rows: ', res)
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
          await rootDb.unsafe(`DROP DATABASE ${dbName};`)
        },
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create test database: ${error.message}`)
    }
    throw error
  }
}

// Cleanup the root connection when all tests are done
export async function cleanupRoot() {
  await rootDb.end()
}
