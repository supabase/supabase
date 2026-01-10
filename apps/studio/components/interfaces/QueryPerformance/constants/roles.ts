export type KnownRole =
  | 'anon'
  | 'authenticated'
  | 'service_role'
  | 'postgres'
  | 'authenticator'
  | 'supabase_auth_admin'
  | 'supabase_storage_admin'
  | 'supabase_etl_admin'
  | 'supabase_realtime_admin'
  | 'supabase_replication_admin'
  | 'supabase_read_only_user'
  | 'dashboard_user'
  | 'supabase_admin'

export const APP_ACCESS_ROLES: KnownRole[] = ['anon', 'authenticated', 'service_role'] as const
export const SUPABASE_SYSTEM_ROLES: KnownRole[] = [
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
] as const

export type RoleInfo = {
  displayName: string
  description: string
}

export const ROLE_INFO: Record<KnownRole, RoleInfo> = {
  anon: {
    displayName: 'Anonymous (Logged Out)',
    description: 'Unauthenticated/public access - for users not logged in',
  },
  authenticated: {
    displayName: 'Authenticated',
    description: 'Authenticated users - for users logged in to your app',
  },
  service_role: {
    displayName: 'Service Role',
    description: 'Elevated server-side access - bypasses RLS policies',
  },
  postgres: {
    displayName: 'Postgres',
    description: 'Database superuser - has full administrative access',
  },
  authenticator: {
    displayName: 'Authenticator',
    description: 'API validator - validates JWTs and handles authentication',
  },
  supabase_auth_admin: {
    displayName: 'Auth Admin',
    description: 'Auth service - manages authentication and user data',
  },
  supabase_storage_admin: {
    displayName: 'Storage Admin',
    description: 'Storage service - manages file storage operations',
  },
  supabase_etl_admin: {
    displayName: 'ETL Admin',
    description: 'ETL replication - read-all access for replication purposes',
  },
  supabase_realtime_admin: {
    displayName: 'Realtime Admin',
    description: 'Realtime service - manages real-time subscriptions and broadcasts',
  },
  supabase_replication_admin: {
    displayName: 'Replication Admin',
    description: 'Replication service - manages logical replication and CDC',
  },
  supabase_read_only_user: {
    displayName: 'Read-Only User',
    description: 'Read-only access - for monitoring and analytics purposes',
  },
  dashboard_user: {
    displayName: 'Dashboard User',
    description: 'Dashboard access - for viewing and managing via Supabase dashboard',
  },
  supabase_admin: {
    displayName: 'Supabase Admin',
    description: 'Internal - used by Supabase for administrative tasks',
  },
}

export function isKnownRole(role: string): role is KnownRole {
  return role in ROLE_INFO
}

export type RoleGroup = {
  name: string
  options: string[]
}
