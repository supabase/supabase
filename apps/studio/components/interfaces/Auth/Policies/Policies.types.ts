import type { DisplayableSqlFragment, SafeSqlFragment } from '@supabase/pg-meta'

export interface PolicyFormField {
  id?: number
  name: string
  schema: string
  table: string
  table_id?: number
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL' | null
  check: string | null
  definition: string | null
  roles: string[]
}

export interface PolicyForReview {
  description?: string
  statement?: string
}

export interface PostgresPolicyCreatePayload {
  name: string
  table: string
  schema?: string
  definition?: SafeSqlFragment
  check?: SafeSqlFragment
  action?: 'PERMISSIVE' | 'RESTRICTIVE'
  command?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles?: string[]
}

export interface PostgresPolicyUpdatePayload {
  id: number
  name?: string
  definition?: SafeSqlFragment
  check?: SafeSqlFragment
  roles?: string[]
}

/**
 * Pre-acceptance shape of {@link PostgresPolicyCreatePayload}. `definition`/`check` are
 * `DisplayableSqlFragment` because they originate from form input and have not yet been
 * promoted via `acceptUntrustedSql`. Promotion must happen at the user gesture
 * (the Save click in `PolicyEditorModal`), not inside a utility.
 */
export interface DraftPostgresPolicyCreatePayload extends Omit<
  PostgresPolicyCreatePayload,
  'definition' | 'check'
> {
  definition?: DisplayableSqlFragment
  check?: DisplayableSqlFragment
}

/** Pre-acceptance shape of {@link PostgresPolicyUpdatePayload}. See {@link DraftPostgresPolicyCreatePayload}. */
export interface DraftPostgresPolicyUpdatePayload extends Omit<
  PostgresPolicyUpdatePayload,
  'definition' | 'check'
> {
  definition?: DisplayableSqlFragment
  check?: DisplayableSqlFragment
}
