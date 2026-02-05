// Default Supabase CLI constants (hardcoded for local development)
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const API_URL = 'http://127.0.0.1:54321'

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
  const response = await fetch(`${API_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql, parameters: params }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Database query failed: ${error.message || JSON.stringify(error)}`)
  }

  return response.json()
}
