export function getHumanReadableTitle(title: string) {
  switch (title) {
    case 'unindexed_foreign_keys':
      return 'Unindexed foreign keys'
    case 'auth_users_exposed':
      return 'Exposed Auth Users'
    case 'auth_rls_initplan':
      return 'Auth RLS Initialization Plan'
    case 'no_primary_key':
      return 'No Primary Key'
    case 'unused_index':
      return 'Unused Index'
    case 'multiple_permissive_policies':
      return 'Multiple Permissive Policies'
    default:
      return 'Unknown Lint Title'
  }
}
