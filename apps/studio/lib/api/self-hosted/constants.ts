// Constants specific to self-hosted environments

// Schemas exposed via PostgREST Data API.
// In hosted Supabase, PostgREST sets the `pgrst.db_schemas` GUC on its own connections.
// In self-hosted/local environments this GUC isn't available to other services (e.g. Studio),
// so we hardcode the default here until a dynamic config source is wired up.
// See: https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml#L183
export const DEFAULT_EXPOSED_SCHEMAS = 'public, storage'

export const ENCRYPTION_KEY = process.env.PG_META_CRYPTO_KEY || 'SAMPLE_KEY'
export const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10)
export const POSTGRES_HOST = process.env.POSTGRES_HOST || 'db'
export const POSTGRES_DATABASE = process.env.POSTGRES_DB || 'postgres'
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres'
export const POSTGRES_USER_READ_WRITE = process.env.POSTGRES_USER_READ_WRITE || 'supabase_admin'
export const POSTGRES_USER_READ_ONLY =
  process.env.POSTGRES_USER_READ_ONLY || 'supabase_read_only_user'
