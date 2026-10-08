// DuckLake can use the current project for managed catalog and storage, or connect to an existing
// Postgres catalog and S3-compatible storage.
export const DUCKLAKE_MODE_SUPABASE = 'supabase'
export const DUCKLAKE_MODE_CUSTOM = 'custom'
export type DucklakeMode = typeof DUCKLAKE_MODE_SUPABASE | typeof DUCKLAKE_MODE_CUSTOM
