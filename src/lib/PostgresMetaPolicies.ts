import { ident } from 'pg-format'
import { DEFAULT_SYSTEM_SCHEMAS } from './constants.js'
import { filterByList, filterByValue } from './helpers.js'
import { PostgresMetaResult, PostgresPolicy } from './types.js'
import { POLICIES_SQL } from './sql/policies.sql.js'

export default class PostgresMetaPolicies {
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
  } = {}): Promise<PostgresMetaResult<PostgresPolicy[]>> {
    const schemaFilter = filterByList(
      includedSchemas,
      excludedSchemas,
      !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
    )
    let sql = POLICIES_SQL({ schemaFilter, limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresPolicy>>
  async retrieve({
    name,
    table,
    schema,
  }: {
    name: string
    table: string
    schema: string
  }): Promise<PostgresMetaResult<PostgresPolicy>>
  async retrieve({
    id,
    name,
    table,
    schema = 'public',
  }: {
    id?: number
    name?: string
    table?: string
    schema?: string
  }): Promise<PostgresMetaResult<PostgresPolicy>> {
    const schemaFilter = schema ? filterByList([schema], []) : undefined
    if (id) {
      const idsFilter = filterByValue([`${id}`])
      const sql = POLICIES_SQL({ idsFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a policy with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name && table) {
      const functionNameIdentifierFilter = filterByValue([`${table}.${name}`])
      const sql = POLICIES_SQL({ schemaFilter, functionNameIdentifierFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return {
          data: null,
          error: { message: `Cannot find a policy named ${name} for table ${schema}.${table}` },
        }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on policy retrieve' } }
    }
  }

  async create({
    name,
    table,
    schema = 'public',
    definition,
    check,
    action = 'PERMISSIVE',
    command = 'ALL',
    roles = ['public'],
  }: {
    name: string
    table: string
    schema?: string
    definition?: string
    check?: string
    action?: string
    command?: string
    roles?: string[]
  }): Promise<PostgresMetaResult<PostgresPolicy>> {
    const definitionClause = definition === undefined ? '' : `USING (${definition})`
    const checkClause = check === undefined ? '' : `WITH CHECK (${check})`
    const sql = `
CREATE POLICY ${ident(name)} ON ${ident(schema)}.${ident(table)}
  AS ${action}
  FOR ${command}
  TO ${roles.map(ident).join(',')}
  ${definitionClause} ${checkClause};`
    const { error } = await this.query(sql)
    if (error) {
      return { data: null, error }
    }
    return await this.retrieve({ name, table, schema })
  }

  async update(
    id: number,
    {
      name,
      definition,
      check,
      roles,
    }: {
      name: string
      definition?: string
      check?: string
      roles?: string[]
    }
  ): Promise<PostgresMetaResult<PostgresPolicy>> {
    const { data: old, error } = await this.retrieve({ id })
    if (error) {
      return { data: null, error }
    }

    const alter = `ALTER POLICY ${ident(old!.name)} ON ${ident(old!.schema)}.${ident(old!.table)}`
    const nameSql = name === undefined ? '' : `${alter} RENAME TO ${ident(name)};`
    const definitionSql = definition === undefined ? '' : `${alter} USING (${definition});`
    const checkSql = check === undefined ? '' : `${alter} WITH CHECK (${check});`
    const rolesSql = roles === undefined ? '' : `${alter} TO ${roles.map(ident).join(',')};`

    // nameSql must be last
    const sql = `BEGIN; ${definitionSql} ${checkSql} ${rolesSql} ${nameSql} COMMIT;`
    {
      const { error } = await this.query(sql)
      if (error) {
        return { data: null, error }
      }
    }
    return await this.retrieve({ id })
  }

  async remove(id: number): Promise<PostgresMetaResult<PostgresPolicy>> {
    const { data: policy, error } = await this.retrieve({ id })
    if (error) {
      return { data: null, error }
    }
    const sql = `DROP POLICY ${ident(policy!.name)} ON ${ident(policy!.schema)}.${ident(
      policy!.table
    )};`
    {
      const { error } = await this.query(sql)
      if (error) {
        return { data: null, error }
      }
    }
    return { data: policy!, error: null }
  }
}
