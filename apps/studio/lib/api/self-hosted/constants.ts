// Constants specific to self-hosted environments

export const ENCRYPTION_KEY = process.env.PG_META_CRYPTO_KEY || 'SAMPLE_KEY'
export const POSTGRES_PORT = process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432
export const POSTGRES_HOST = process.env.POSTGRES_HOST || 'db'
export const POSTGRES_DATABASE = process.env.POSTGRES_DB || 'postgres'
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres'
export const POSTGRES_USER_READ_WRITE = process.env.POSTGRES_USER_READ_WRITE || 'supabase_admin'
export const POSTGRES_USER_READ_ONLY =
  process.env.POSTGRES_USER_READ_ONLY || 'supabase_read_only_user'

/**
 * Gets the database host from SUPABASE_PUBLIC_URL if available,
 * otherwise defaults to 127.0.0.1 for CLI/local instances.
 * For self-hosted Docker Compose, SUPABASE_PUBLIC_URL will contain the correct hostname.
 */
export const getDbHost = (): string => {
  if (process.env.SUPABASE_PUBLIC_URL) {
    try {
      const url = new URL(process.env.SUPABASE_PUBLIC_URL)
      return url.hostname
    } catch {
      return '127.0.0.1'
    }
  }
  return '127.0.0.1'
}
