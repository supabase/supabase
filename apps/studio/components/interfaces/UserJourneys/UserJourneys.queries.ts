import { getPaginatedUsersSQL } from '@supabase/pg-meta'

import { executeSql } from '@/data/sql/execute-sql-mutation'

export interface JourneyUser {
  id: string
  email: string | null
  createdAt: string | null
  lastSignInAt: string | null
}

export async function searchAuthUsers(
  projectRef: string,
  connectionString: string | null,
  keywords: string,
  signal?: AbortSignal
): Promise<JourneyUser[]> {
  const sql = getPaginatedUsersSQL({
    keywords,
    limit: 20,
    sort: 'id',
    order: 'asc',
  })
  const { result } = await executeSql<
    { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[]
  >({ projectRef, connectionString, sql }, signal)
  return result.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
  }))
}
