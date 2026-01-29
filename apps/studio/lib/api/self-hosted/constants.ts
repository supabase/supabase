// Constants specific to self-hosted environments

export const ENCRYPTION_KEY = process.env.PG_META_CRYPTO_KEY || 'SAMPLE_KEY'
export const POSTGRES_PORT = (() => {
  const port = process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432
  // Validate port is a positive finite integer
  if (!Number.isFinite(port) || port <= 0 || !Number.isInteger(port)) {
    console.warn(`Invalid POSTGRES_PORT "${process.env.POSTGRES_PORT}", using default 5432`)
    return 5432
  }
  return port
})()
export const POSTGRES_HOST = process.env.POSTGRES_HOST || 'db'
export const POSTGRES_DATABASE = process.env.POSTGRES_DB || 'postgres'
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres'
export const POSTGRES_USER_READ_WRITE = process.env.POSTGRES_USER_READ_WRITE || 'supabase_admin'
export const POSTGRES_USER_READ_ONLY =
  process.env.POSTGRES_USER_READ_ONLY || 'supabase_read_only_user'
