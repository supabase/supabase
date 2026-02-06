import { query } from './client.js'

/**
 * Check if a table exists in the specified schema.
 *
 * @param schema - The schema name (e.g., 'public')
 * @param tableName - The table name to check
 * @returns true if the table exists, false otherwise
 */
export async function tableExists(schema: string, tableName: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = $2
     ) as exists`,
    [schema, tableName]
  )
  return result[0]?.exists ?? false
}
