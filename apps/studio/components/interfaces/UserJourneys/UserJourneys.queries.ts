import { getPaginatedUsersSQL } from '@supabase/pg-meta'

import { authKeys } from '@/data/auth/keys'
import { getQueryClient } from '@/data/query-client'
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
  const queryClient = getQueryClient()
  const result = await queryClient.fetchQuery<
    { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[]
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: authKeys.usersSearch(projectRef, keywords),
    queryFn: () => {
      const sql = getPaginatedUsersSQL({
        keywords,
        limit: 20,
        sort: 'id',
        order: 'asc',
      })
      return executeSql<
        { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[]
      >({ projectRef, connectionString, sql }, signal).then((res) => res.result)
    },
  })
  return result.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
  }))
}
