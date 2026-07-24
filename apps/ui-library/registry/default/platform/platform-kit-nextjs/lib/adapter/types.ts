import type { IntrospectedTable } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/introspection-types'

/**
 * Feature flags an adapter declares so the UI can show/hide panels and controls.
 * Every flag defaults to what the backend can actually do — e.g. supalite sets
 * everything except `introspection`, `tableRows`, and (optionally) `storage` to
 * false.
 */
export interface PlatformFeatures {
  /** List tables/columns. Always true. */
  introspection: boolean
  /** Read/write table rows via supabase-js `.from()`. */
  tableRows: boolean
  /** Read/update auth configuration. */
  authConfig: boolean
  /** List/manage users and the signups chart. */
  authUsers: boolean
  /** Storage buckets/objects. */
  storage: boolean
  /** Project logs. */
  logs: boolean
  /** Project secrets. */
  secrets: boolean
  /** Security/performance advisor suggestions. */
  advisors: boolean
  /** Arbitrary SQL editor (requires a backend transport that can run SQL). */
  runSql: boolean
  /** Natural-language → SQL (requires `runSql` and an injected `generateSql`). */
  naturalLanguageSql: boolean
  /** Whether RLS state is available for display. */
  rlsPolicies: boolean
}

// Loosely-typed domain shapes. The classic adapter uses richer Management API
// types internally; the UI only relies on the fields referenced here.
export type AuthConfig = Record<string, any>

export interface UserRecord {
  id: string
  email?: string | null
  phone?: string | null
  created_at?: string
  last_sign_in_at?: string | null
  [key: string]: any
}

export interface StorageBucket {
  id: string
  name: string
  public: boolean
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface StorageObject {
  name: string
  id?: string | null
  updated_at?: string | null
  created_at?: string | null
  metadata?: Record<string, any> | null
  [key: string]: any
}

export interface Secret {
  name: string
  value?: string
  updated_at?: string
  [key: string]: any
}

export interface Suggestion {
  cache_key?: string
  title: string
  detail: string
  level: 'ERROR' | 'WARN' | 'INFO'
  type?: 'security' | 'performance'
  [key: string]: any
}

export interface LogsResult {
  result?: any[]
  error?: any
  [key: string]: any
}

export interface SelectRowsResult {
  rows: any[]
  count: number | null
}

export interface RowLocator {
  schema?: string
  table: string
}

/**
 * The single contract every backend implements. `createSupabaseAdapter`
 * (classic Supabase, bundled default) and `createSupaliteAdapter` (supalite)
 * are the two shipped implementations; consumers may supply their own.
 *
 * Optional methods are present only when the matching `features` flag is true.
 */
export interface PlatformAdapter {
  /** Opaque project identifier; may be undefined for supalite. */
  projectRef?: string
  features: PlatformFeatures

  // --- Introspection (always available) ---
  listTables(schemas?: string[]): Promise<IntrospectedTable[]>

  // --- Table rows via supabase-js `.from()` (both backends) ---
  selectRows(opts: {
    schema?: string
    table: string
    limit?: number
    offset?: number
  }): Promise<SelectRowsResult>
  updateRow(opts: {
    schema?: string
    table: string
    values: Record<string, any>
    match: Record<string, any>
  }): Promise<void>
  insertRow?(opts: { schema?: string; table: string; values: Record<string, any> }): Promise<void>
  deleteRow?(opts: { schema?: string; table: string; match: Record<string, any> }): Promise<void>

  // --- Optional capabilities (gated by the matching feature flag) ---
  getAuthConfig?(): Promise<AuthConfig>
  updateAuthConfig?(payload: Partial<AuthConfig>): Promise<AuthConfig>

  listUsers?(opts: { page?: number; perPage?: number }): Promise<{
    users: UserRecord[]
    total: number | null
  }>
  userCountsByDay?(days: number): Promise<{ date: string; users: number }[]>

  listBuckets?(): Promise<StorageBucket[]>
  listObjects?(bucketId: string, path?: string): Promise<StorageObject[]>

  getLogs?(opts: { sql?: string; start?: string; end?: string }): Promise<LogsResult>

  getSecrets?(): Promise<Secret[]>
  createSecrets?(secrets: { name: string; value: string }[]): Promise<void>
  deleteSecrets?(names: string[]): Promise<void>

  getAdvisors?(): Promise<Suggestion[]>

  runSql?(opts: { query: string; readOnly?: boolean }): Promise<any[]>
  generateSql?(prompt: string): Promise<{ sql: string }>

  /** External dashboard URL for the "Open in Supabase" link; null to hide it. */
  dashboardUrl?(): string | null
}
