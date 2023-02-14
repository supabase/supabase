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
    disabled: false,
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
