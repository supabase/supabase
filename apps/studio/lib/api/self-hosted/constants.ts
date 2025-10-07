// Constants specific to self-hosted environments

export const ENCRYPTION_KEY = process.env.PG_META_CRYPTO_KEY || 'SAMPLE_KEY'
export const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432
export const POSTGRES_HOST = process.env.POSTGRES_HOST || 'db'
export const POSTGRES_DATABASE = process.env.POSTGRES_DB || 'postgres'
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres'
export const POSTGRES_USER_READ_WRITE = 'postgres'
export const POSTGRES_USER_READ_ONLY = 'supabase_read_only_user'
