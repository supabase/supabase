export const APP_ACCESS_ROLES = ['anon', 'authenticated', 'service_role']
export const SUPABASE_SYSTEM_ROLES = [
  'postgres',
  'authenticator',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_etl_admin',
  'supabase_realtime_admin',
  'supabase_replication_admin',
  'supabase_read_only_user',
  'dashboard_user',
  'supabase_admin',
]

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  anon: 'Unauthenticated/public access - for users not logged in',
  authenticated: 'Authenticated users - for users logged in to your app',
  service_role: 'Elevated server-side access - bypasses RLS policies',
  postgres: 'Database superuser - has full administrative access',
  authenticator: 'API validator - validates JWTs and handles authentication',
  supabase_auth_admin: 'Auth service - manages authentication and user data',
  supabase_storage_admin: 'Storage service - manages file storage operations',
  supabase_etl_admin: 'ETL replication - read-all access for replication purposes',
  supabase_realtime_admin: 'Realtime service - manages real-time subscriptions and broadcasts',
  supabase_replication_admin: 'Replication service - manages logical replication and CDC',
  supabase_read_only_user: 'Read-only access - for monitoring and analytics purposes',
  dashboard_user: 'Dashboard access - for viewing and managing via Supabase dashboard',
  supabase_admin: 'Internal - used by Supabase for administrative tasks',
}

export type RoleGroup = {
  name: string
  options: string[]
}
