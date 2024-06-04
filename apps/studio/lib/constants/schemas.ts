/**
 * A list of system schemas that users should not interact with
 */
export const EXCLUDED_SCHEMAS = [
  'auth',
  'cron',
  'extensions',
  'information_schema',
  'net',
  'pgsodium',
  'pgsodium_masks',
  'pgbouncer',
  'pgtle',
  'realtime',
  'storage',
  'supabase_functions',
  'supabase_migrations',
  'vault',
  'graphql',
  'graphql_public',
]

export const EXCLUDED_SCHEMAS_WITHOUT_EXTENSIONS = EXCLUDED_SCHEMAS.filter(
  (x) => x !== 'extensions'
)
