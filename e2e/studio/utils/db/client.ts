import { env } from "../../env.config.js"

/**
 * Execute a SQL query against the local Supabase database via pg-meta.
 *
 * Uses the local Supabase API gateway to route to pg-meta, which executes
 * the query against PostgreSQL using the default local connection.
 *
 * @param sql - The SQL query to execute
 * @param params - Optional array of parameters for parameterized queries
 * @returns Array of result rows
 * @throws Error if the query fails
 */
export async function query<T>(sql: string, params?: Array<unknown>): Promise<Array<T>> {
  const response = await fetch(`${env.API_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql, parameters: params }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Database query failed: ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}
