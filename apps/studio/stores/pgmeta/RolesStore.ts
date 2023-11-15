import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'
import { IRootStore } from '../RootStore'

export interface IRolesStore extends IPostgresMetaInterface<any> {
  systemRoles: string[]
}
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

  systemRoles = [
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

  // loadBySchema is not supported in this store
  async loadBySchema(schema: string) {
    return []
  }
}
