import {
  QUERY_RESULT_ROW_LIMIT,
  resolveQueryWindow,
  type DataPort,
  type LogWindow,
  type QuerySource,
  type Row,
  type Table,
} from '@supabase/mcp-server-supabase/apps'

export interface Entity {
  schema: string
  name: string
}

export interface QueryResult {
  rows: Row[]
  /** Verified table metadata. Present only when the rows came through the table transport. */
  table?: Table
  hasMore: boolean
  truncated?: boolean
  /** The SQL that produced these rows, used to tell when results are stale. */
  sql: string
  offset: number
  limit: number
  paginated?: boolean
}

/** The table transport never reads past this offset; larger tables need selective SQL. */
export const MAX_TABLE_OFFSET = 10_000

export const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`

export const tableSql = (entity: Entity) =>
  `select * from ${quoteIdentifier(entity.schema)}.${quoteIdentifier(entity.name)};`

export const entityId = (entity: Entity) =>
  `entity:${encodeURIComponent(entity.schema)}:${encodeURIComponent(entity.name)}`

export const isTableQuery = (sql: string, entity?: Entity) =>
  entity !== undefined && sql === tableSql(entity)

// Deliberately recognize only full-row, single-table reads that the table
// transport can represent exactly. Everything else remains ordinary SQL.
const identifier = '(?:"(?:[^"\\0]|"")+"|[a-z_][a-z0-9_$]*)'
const tableSelect = new RegExp(
  `^\\s*select\\s+\\*\\s+from\\s+(${identifier}(?:\\s*\\.\\s*${identifier})?)(?:\\s+limit\\s+(\\d+))?(?:\\s+offset\\s+(\\d+))?\\s*;?\\s*$`,
  'i'
)

export function parseTableSelect(sql: string) {
  const match = tableSelect.exec(sql)
  if (!match) return undefined
  const limit = match[2] === undefined ? undefined : Number(match[2])
  const offset = Number(match[3] ?? 0)
  const isLimitInvalid = limit !== undefined && (limit < 1 || !Number.isSafeInteger(limit))
  if (isLimitInvalid || offset > MAX_TABLE_OFFSET) return undefined
  return { relation: match[1], limit, offset }
}

async function resolveTable(
  data: DataPort,
  projectId: string,
  relation: string
): Promise<Entity | undefined> {
  // Let Postgres resolve search_path and quoted identifiers. Never assume that
  // an unqualified name refers to public, or infer a writable table from rows.
  const literal = `E'${relation.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`
  const [table] = await data.executeSql({
    project_id: projectId,
    query: `select n.nspname as schema, c.relname as name from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where c.oid = pg_catalog.to_regclass(${literal}) and c.relkind in ('r', 'p');`,
  })
  if (typeof table?.schema !== 'string' || typeof table?.name !== 'string') return undefined
  return { schema: table.schema, name: table.name }
}

async function runCustomQuery(
  data: DataPort,
  projectId: string,
  sql: string,
  limit: number,
  source: QuerySource,
  logWindow?: LogWindow
): Promise<QueryResult> {
  let rows: Row[]
  if (source === 'logs') {
    const window = resolveQueryWindow({ source, ...logWindow })
    if (!window) throw new Error('Log queries need a time window.')
    rows = await data.queryLogs({ project_id: projectId, sql, ...window })
  } else {
    rows = await data.executeSql({ project_id: projectId, query: sql })
  }
  return {
    rows: rows.slice(0, QUERY_RESULT_ROW_LIMIT),
    truncated: rows.length > QUERY_RESULT_ROW_LIMIT,
    hasMore: false,
    sql,
    offset: 0,
    limit,
  }
}

/**
 * One execution adapter and result model for every query tab. The bounded
 * table transport supplies precise values and verified metadata; custom SQL
 * uses the SQL tool so its server permission and approval policy stays intact.
 */
/** What the editor asks its host to run. */
export interface QueryRunRequest {
  sql: string
  /** The table a tab was opened from; lets the host use the exact table read. */
  entity?: Entity
  offset: number
  limit: number
  source: QuerySource
  logWindow?: LogWindow
}

/** Runs a query for the editor. The host decides how, e.g. `executeQuery` over its data client. */
export type RunQuery = (request: QueryRunRequest) => Promise<QueryResult>

export async function executeQuery(
  data: DataPort,
  projectId: string,
  sql: string,
  entity: Entity | undefined,
  offset: number,
  limit: number,
  source: QuerySource = 'database',
  logWindow?: LogWindow
): Promise<QueryResult> {
  if (source === 'logs') return runCustomQuery(data, projectId, sql, limit, source, logWindow)

  const isGenerated = isTableQuery(sql, entity)
  const selection = parseTableSelect(sql)
  let target = isGenerated ? entity : undefined
  if (!target && selection) {
    try {
      target = await resolveTable(data, projectId, selection.relation)
    } catch {
      // Metadata is optional: the original query may still be readable.
    }
  }
  if (!target) return runCustomQuery(data, projectId, sql, limit, source)

  const sqlLimit = isGenerated ? undefined : selection?.limit
  const rowLimit = sqlLimit === undefined ? limit : Math.min(limit, sqlLimit - offset)
  const rowOffset = isGenerated ? offset : (selection?.offset ?? 0) + offset
  try {
    const result = await data.readTable({
      project_id: projectId,
      schema: target.schema,
      table: target.name,
      offset: rowOffset,
      limit: rowLimit,
    })
    const isWithinSqlLimit = sqlLimit === undefined || offset + rowLimit < sqlLimit
    return {
      ...result,
      sql,
      offset,
      limit: rowLimit,
      paginated: sqlLimit === undefined || sqlLimit > limit,
      hasMore: result.hasMore && isWithinSqlLimit && rowOffset + rowLimit <= MAX_TABLE_OFFSET,
    }
  } catch (error) {
    if (isGenerated) throw error
    // Views, unavailable metadata, or an unsupported table adapter must not
    // prevent running the user's original SELECT as a read-only result.
    return runCustomQuery(data, projectId, sql, limit, source)
  }
}
