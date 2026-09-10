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
}

export const ROLE_INFO: Record<KnownRole, RoleInfo> = {
  anon: {
    displayName: 'Anonymous (Logged Out)',
  },
  authenticated: {
    displayName: 'Authenticated (Logged In)',
  },
  service_role: {
    displayName: 'Service Role',
  },
  postgres: {
    displayName: 'Postgres',
  },
  authenticator: {
    displayName: 'Authenticator',
  },
  supabase_auth_admin: {
    displayName: 'Auth Admin',
  },
  supabase_storage_admin: {
    displayName: 'Storage Admin',
  },
  supabase_etl_admin: {
    displayName: 'ETL Admin',
  },
  supabase_realtime_admin: {
    displayName: 'Realtime Admin',
  },
  supabase_replication_admin: {
    displayName: 'Replication Admin',
  },
  supabase_read_only_user: {
    displayName: 'Read-Only User',
  },
  dashboard_user: {
    displayName: 'Dashboard User',
  },
  supabase_admin: {
    displayName: 'Supabase Admin',
  },
}

export function isKnownRole(role: string): role is KnownRole {
  return role in ROLE_INFO
}

export type RoleGroup = {
  name: string
  options: string[]
}
