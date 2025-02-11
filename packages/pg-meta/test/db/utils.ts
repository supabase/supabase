import postgres from 'postgres'
import { randomUUID } from 'crypto'

const ROOT_DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432'
const ROOT_DB_NAME = process.env.DATABASE_NAME ?? 'postgres'
// Connection to the postgres server (not a specific database)
const rootDb = postgres(`${ROOT_DB_URL}/${ROOT_DB_NAME}`)

export async function createTestDatabase() {
  const dbName = `test_${randomUUID().replace(/-/g, '_')}`

  try {
    // Create a new database for this test
    await rootDb.unsafe(`CREATE DATABASE ${dbName};`)

    // Create a new connection to the test database
    const testDb = postgres(`${ROOT_DB_URL}/${dbName}`, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    // Return both the database name and the client
    return {
      dbName,
      executeQuery: async <T = any>(query: string): Promise<T> => {
        try {
          const result = (await testDb.unsafe(query)).map((v) => v)
          return result as T
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to execute query: ${error.message}`)
          }
          throw error
        }
      },
      cleanup: async () => {
        // Close the test database connection
        await testDb.end()
        // Drop the test database
        await rootDb.unsafe(`DROP DATABASE ${dbName};`)
      },
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
