import { ident } from 'pg-format'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { filterByList, filterByValue } from './helpers.js'
import {
  PostgresMetaResult,
  PostgresTablePrivileges,
  PostgresTablePrivilegesGrant,
  PostgresTablePrivilegesRevoke,
} from './types.js'
import { TABLE_PRIVILEGES_SQL } from './sql/table_privileges.sql.js'

export default class PostgresMetaTablePrivileges {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list({
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
  }: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<PostgresMetaResult<PostgresTablePrivileges[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    const sql = TABLE_PRIVILEGES_SQL({ schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresTablePrivileges>>
  async retrieve({
    name,
    schema,
  }: {
    name: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresTablePrivileges>>
  async retrieve({
    id,
    name,
    schema = 'public',
  }: {
    id?: number
    name?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresTablePrivileges>> {
    if (id) {
      const idsFilter = filterByValue([id])
      const sql = TABLE_PRIVILEGES_SQL({ idsFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a relation with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const nameIdentifierFilter = filterByValue([`${schema}.${name}`])
      const sql = TABLE_PRIVILEGES_SQL({ nameIdentifierFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a relation named ${name} in schema ${schema}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on retrieving table privileges' } }
    }
  }

  async grant(
    grants: PostgresTablePrivilegesGrant[]
  ): Promise<PostgresMetaResult<PostgresTablePrivileges[]>> {
    let sql = `
do $$
begin
${grants
  .map(
    ({ privilege_type, relation_id, grantee, is_grantable }) =>
      `execute format('grant ${privilege_type} on table %s to ${
        grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
      } ${is_grantable ? 'with grant option' : ''}', ${relation_id}::regclass);`
  )
  .join('\n')}
end $$;
`
    const { data, error } = await this.query(sql)
    if (error) {
      return { data, error }
    }

    // Return the updated table privileges for modified relations.
    const relationIds = [...new Set(grants.map(({ relation_id }) => relation_id))]
    sql = TABLE_PRIVILEGES_SQL({ idsFilter: filterByList(relationIds) })
    return await this.query(sql)
  }

  async revoke(
    revokes: PostgresTablePrivilegesRevoke[]
  ): Promise<PostgresMetaResult<PostgresTablePrivileges[]>> {
    let sql = `
do $$
begin
${revokes
  .map(
    (revoke) =>
      `execute format('revoke ${revoke.privilege_type} on table %s from ${
        revoke.grantee.toLowerCase() === 'public' ? 'public' : ident(revoke.grantee)
      }', ${revoke.relation_id}::regclass);`
  )
  .join('\n')}
end $$;
`
    const { data, error } = await this.query(sql)
    if (error) {
      return { data, error }
    }

    // Return the updated table privileges for modified relations.
    const relationIds = [...new Set(revokes.map(({ relation_id }) => relation_id))]
    sql = TABLE_PRIVILEGES_SQL({ idsFilter: filterByList(relationIds) })
    return await this.query(sql)
  }
}
