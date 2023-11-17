export const SUPABASE_ROLES = [
  'anon',
  'service_role',
  'authenticated',
  'authenticator',
  'dashboard_user',
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_replication_admin',
  'supabase_storage_admin',
  'supabase_functions_admin',
  'pgbouncer',
  'pgsodium_keyholder',
  'pgsodium_keyiduser',
  'pgsodium_keymaker',
]

export const ROLE_PERMISSIONS: any = {
  can_login: {
    disabled: false,
    description: 'User can login',
  },
  can_create_role: {
    disabled: false,
    description: 'User can create roles',
  },
  can_create_db: {
    disabled: false,
    description: 'User can create databases',
  },
  can_bypass_rls: {
    disabled: true,
    description: 'User bypasses every row level security policy',
  },
  is_superuser: {
    disabled: true,
    description: 'User is a Superuser',
  },
  is_replication_role: {
    disabled: true,
    description:
      'User can initiate streaming replication and put the system in and out of backup mode',
  },
}
