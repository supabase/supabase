import { QUEUES_SCHEMA } from 'data/database-queues/database-queues-toggle-postgrest-mutation'

/**
 * A list of system schemas that users should not interact with
 */
export const PROTECTED_SCHEMAS = [
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
  QUEUES_SCHEMA,
]

export const PROTECTED_SCHEMAS_WITHOUT_EXTENSIONS = PROTECTED_SCHEMAS.filter(
  (x) => x !== 'extensions'
)
