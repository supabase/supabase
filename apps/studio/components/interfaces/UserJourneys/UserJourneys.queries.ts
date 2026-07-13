import { getPaginatedUsersSQL } from '@supabase/pg-meta'

import { executeSql } from '@/data/sql/execute-sql-mutation'

export interface JourneyUser {
  id: string
  email: string | null
  createdAt: string | null
  lastSignInAt: string | null
}

// The SQL below is OTEL/ClickHouse-only — the legacy BigQuery path has no
// auth_event.* / user-correlation fields (phase 1 finding). The endpoint is no
// longer hardcoded: callers pass `useOtel` (from `useFlag('otelUnifiedLogs')`,
// the same flag the Unified Logs hooks read) so the two backends never get
// crossed. When the flag is off there is no BigQuery equivalent to run, which is
// acceptable while this timeline is parked pending the auth_logs pipeline fix.

/** auth.users lookup — reuses the exact SQL Studio's Auth > Users page runs, so no hand-written raw SQL against auth.users. */
export async function searchAuthUserByEmail(
  projectRef: string,
  connectionString: string | null,
  email: string,
  signal?: AbortSignal
): Promise<JourneyUser | undefined> {
  // `keywords` is a substring match, so over-fetch a little and pick the exact match
  // client-side rather than trusting result[0] on a possible substring collision.
  const sql = getPaginatedUsersSQL({
    keywords: email,
    limit: 5,
    sort: 'id',
    order: 'asc',
  })
  const { result } = await executeSql<
    { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[]
  >({ projectRef, connectionString, sql }, signal)
  const row = result.find((r) => r.email?.toLowerCase() === email.toLowerCase()) ?? result[0]
  if (!row) return undefined
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
  }
}
