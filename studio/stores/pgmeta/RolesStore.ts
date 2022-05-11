import PostgresMetaInterface from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export default class RolesStore extends PostgresMetaInterface<any> {
  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
  }

  list(filter: any) {
    const systemRoles = [
      'postgres',
      'pgbouncer',
      'supabase_admin',
      'supabase_auth_admin',
      'supabase_storage_admin',
      'dashboard_user',
      'authenticator',
      'pg_database_owner',
      'pg_read_all_data',
      'pg_write_all_data',
    ]

    const rolesFilter = (role: any) =>
      !systemRoles.includes(role.name) && (typeof filter === 'function' ? filter(role) : true)

    return super.list(rolesFilter)
  }
}
