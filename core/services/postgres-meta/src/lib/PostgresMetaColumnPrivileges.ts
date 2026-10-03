import { ident, literal } from 'pg-format'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { filterByValue, filterByList } from './helpers.js'
import { COLUMN_PRIVILEGES_SQL } from './sql/column_privileges.sql.js'
import {
  PostgresMetaResult,
  PostgresColumnPrivileges,
  PostgresColumnPrivilegesGrant,
  PostgresColumnPrivilegesRevoke,
} from './types.js'

export default class PostgresMetaColumnPrivileges {
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
  } = {}): Promise<PostgresMetaResult<PostgresColumnPrivileges[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    const sql = COLUMN_PRIVILEGES_SQL({ schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async grant(
    grants: PostgresColumnPrivilegesGrant[]
  ): Promise<PostgresMetaResult<PostgresColumnPrivileges[]>> {
    let sql = `
do $$
declare
  col record;
begin
${grants
  .map(({ privilege_type, column_id, grantee, is_grantable }) => {
    const [relationId, columnNumber] = column_id.split('.')
    return `
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'grant ${privilege_type} (%I) on %s to ${
    grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
  } ${is_grantable ? 'with grant option' : ''}',
  col.attname,
  col.attrelid::regclass
);`
  })
  .join('\n')}
end $$;
`
    const { data, error } = await this.query(sql)
    if (error) {
      return { data, error }
    }

    // Return the updated column privileges for modified columns.
    const columnIds = [...new Set(grants.map(({ column_id }) => column_id))]
    const columnIdsFilter = filterByValue(columnIds)
    sql = COLUMN_PRIVILEGES_SQL({ columnIdsFilter })
    return await this.query(sql)
  }

  async revoke(
    revokes: PostgresColumnPrivilegesRevoke[]
  ): Promise<PostgresMetaResult<PostgresColumnPrivileges[]>> {
    let sql = `
do $$
declare
  col record;
begin
${revokes
  .map(({ privilege_type, column_id, grantee }) => {
    const [relationId, columnNumber] = column_id.split('.')
    return `
select *
from pg_attribute a
where a.attrelid = ${literal(relationId)}
  and a.attnum = ${literal(columnNumber)}
into col;
execute format(
  'revoke ${privilege_type} (%I) on %s from ${
    grantee.toLowerCase() === 'public' ? 'public' : ident(grantee)
  }',
  col.attname,
  col.attrelid::regclass
);`
  })
  .join('\n')}
end $$;
`
    const { data, error } = await this.query(sql)
    if (error) {
      return { data, error }
    }

    // Return the updated column privileges for modified columns.
    const columnIds = [...new Set(revokes.map(({ column_id }) => column_id))]
    const columnIdsFilter = filterByValue(columnIds)
    sql = COLUMN_PRIVILEGES_SQL({ columnIdsFilter })
    return await this.query(sql)
  }
}
