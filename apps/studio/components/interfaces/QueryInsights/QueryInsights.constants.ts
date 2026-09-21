export const SUPAMONITOR_EXCLUDED_ROLES = [
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_realtime_admin',
  'pgbouncer',
  'dashboard_user',
] as const

export const SUPAMONITOR_EXCLUDED_APP_NAMES = ['supabase-dashboard', 'mgmt-api'] as const

export const TRANSACTION_CONTROL_REGEX =
  /^\s*(BEGIN|COMMIT|ROLLBACK|SET\s|RESET\s|DISCARD|DEALLOCATE|SHOW\s)/i

export const SCHEMA_INTROSPECTION_REGEX =
  /\bFROM\s+(?:pg_catalog\.|information_schema\.|pg_class\b|pg_attribute\b|pg_type\b|pg_namespace\b)/i
