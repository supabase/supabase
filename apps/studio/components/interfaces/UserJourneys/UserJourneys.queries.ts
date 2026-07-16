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

/** auth.users keyword search (id/email/phone/name) — same paginated query as the Auth > Users page, capped for a filter dropdown. */
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
