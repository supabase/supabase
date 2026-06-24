/**
 * Deterministically rewrites a legacy BigQuery logs query into the ClickHouse
 * dialect + schema used by the OTEL `logs.all.otel` endpoint.
 *
 * The old logs live in per-service tables (`edge_logs`, `postgres_logs`, …) with
 * nested fields reached through `cross join unnest(metadata)`. The OTEL endpoint
 * stores everything in one `logs` table keyed by `source`, with those fields in a
 * `log_attributes` map. So the rewrite, done on the parsed query tree:
 *   - points the FROM at `logs` and adds `source = '<table>'`
 *   - drops the `unnest` joins
 *   - turns `request.method` style refs into `log_attributes['request.method']`
 *   - wraps numeric fields in `toInt32OrZero` so comparisons still work
 *
 * Parsing/generation runs through the WASM-backed polyglot SDK, loaded lazily so
 * it never enters the main bundle.
 */

// Legacy BigQuery logs tables. A FROM referencing one of these is remapped onto
// the OTEL `logs` table with a matching `source` filter (the names are identical).
const LOG_TABLES = new Set<string>([
  'edge_logs',
  'postgres_logs',
  'function_logs',
  'function_edge_logs',
  'auth_logs',
  'auth_audit_logs',
  'realtime_logs',
  'storage_logs',
  'postgrest_logs',
  'supavisor_logs',
  'pgbouncer_logs',
  'pg_upgrade_logs',
  'pg_cron_logs',
  'etl_replication_logs',
  'multigres_logs',
])

// BigQuery unnest alias -> OTEL `log_attributes` key prefix. The legacy queries
// unnest `metadata` (aliased `m`/`metadata`, the root, so no prefix) and its
// `request` / `response` / `parsed` structs (which keep their name as the prefix).
const ALIAS_PREFIX: Record<string, string> = {
  request: 'request.',
  response: 'response.',
  parsed: 'parsed.',
  m: '',
  metadata: '',
}

// `log_attributes` values are strings; these keys are compared/aggregated as
// numbers, so they need `toInt32OrZero(...)`.
const NUMERIC_KEYS = new Set([
  'response.status_code',
  'request.status_code',
  'status',
  'execution_time_ms',
])

export interface RewriteResult {
  sql: string
  /** False when the query referenced no legacy log table, so nothing was rewritten. */
  changed: boolean
}

type Sdk = typeof import('@polyglot-sql/sdk')

let sdkPromise: Promise<Sdk> | null = null
const loadSdk = (): Promise<Sdk> => {
  if (sdkPromise === null) {
    sdkPromise = import('@polyglot-sql/sdk').then(async (sdk) => {
      await sdk.init?.()
      return sdk
    })
  }
  return sdkPromise
}

const isUnnestColumn = (node: any): boolean =>
  !!node?.column?.table && ALIAS_PREFIX[node.column.table.name] !== undefined

const otelKey = (node: any): string =>
  `${ALIAS_PREFIX[node.column.table.name]}${node.column.name.name}`

const isSourceColumn = (node: any, source: string): boolean =>
  !!node?.column?.table && (node.column.table.name === source || node.column.table.name === 'logs')

export async function rewriteBqLogsSqlToClickhouse(input: string): Promise<RewriteResult> {
  const sdk = await loadSdk()
  const BQ = sdk.Dialect.BigQuery
  const CH = sdk.Dialect.ClickHouse

  const parsed = sdk.parse(input, BQ)
  if (!parsed.success || !parsed.ast) {
    throw new Error(parsed.error || 'Could not parse the query.')
  }

  // Build a `log_attributes['key']` expression node (numeric-cast when needed) by
  // lifting it out of a tiny parsed query.
  const attrExpr = (key: string): any => {
    const expr = NUMERIC_KEYS.has(key)
      ? `toInt32OrZero(log_attributes['${key}'])`
      : `log_attributes['${key}']`
    return sdk.parse(`select ${expr} as x from t`, CH).ast[0].select.expressions[0].alias.this
  }

  const rewriteColumns = (node: any, source: string): void => {
    if (!node || typeof node !== 'object') return
    for (const k of Object.keys(node)) {
      const child = node[k]
      if (isUnnestColumn(child)) node[k] = attrExpr(otelKey(child))
      else if (isSourceColumn(child, source)) child.column.table = null
      else rewriteColumns(child, source)
    }
  }

  const injectSourceFilter = (select: any, source: string): void => {
    const srcWhere = sdk.parse(`select 1 from t where source = '${source}'`, CH).ast[0].select
      .where_clause
    if (!select.where_clause) {
      select.where_clause = srcWhere
      return
    }
    const andWhere = sdk.parse(`select 1 from t where x and y`, CH).ast[0].select.where_clause
    const conj = Object.keys(andWhere.this)[0]
    andWhere.this[conj].left = srcWhere.this
    andWhere.this[conj].right = select.where_clause.this
    select.where_clause = andWhere
  }

  const remapSelect = (select: any): boolean => {
    const fromTable = select?.from?.expressions?.[0]?.table
    const source = fromTable?.name?.name
    if (!source || !LOG_TABLES.has(source)) return false

    fromTable.name.name = 'logs'
    // Legacy log queries only join via `unnest`; those joins are folded into the
    // `log_attributes` map access, so drop them.
    select.joins = []

    // SELECT list: keep the original leaf name as the alias so result columns
    // (and the renderers reading them) are unchanged.
    select.expressions = select.expressions.map((expr: any) => {
      if (isUnnestColumn(expr)) {
        const leaf = expr.column.name.name
        const aliased = sdk.parse(`select x as ${leaf} from t`, CH).ast[0].select.expressions[0]
        aliased.alias.this = attrExpr(otelKey(expr))
        return aliased
      }
      if (isSourceColumn(expr, source)) {
        expr.column.table = null
        return expr
      }
      rewriteColumns(expr, source)
      return expr
    })

    rewriteColumns(select.where_clause, source)
    rewriteColumns(select.group_by, source)
    rewriteColumns(select.having, source)
    rewriteColumns(select.order_by, source)

    injectSourceFilter(select, source)
    return true
  }

  let changed = false
  for (const statement of parsed.ast) {
    if (statement?.select) changed = remapSelect(statement.select) || changed
  }
  if (!changed) return { sql: input, changed: false }

  const generated = sdk.generate(parsed.ast, CH)
  if (!generated.success || !generated.sql?.[0]) {
    throw new Error(generated.error || 'Could not generate ClickHouse SQL.')
  }
  return { sql: generated.sql[0], changed: true }
}

/**
 * Prompt for the AI Assistant to rewrite a Logs Explorer query from the old
 * BigQuery dialect to the ClickHouse-backed OTEL logs schema. Used as the
 * fallback when the deterministic rewrite above can't handle a query. Includes
 * the current query when present; otherwise asks for general guidance.
 */
export function buildClickhouseRewritePrompt(sql?: string): string {
  const intro =
    'The Logs Explorer now runs on a ClickHouse-backed engine instead of BigQuery, which uses a different SQL dialect and schema (a single `logs` table with fields in the `log_attributes` map, keyed by `source`).'
  const trimmed = sql?.trim()
  if (!trimmed) {
    return `${intro}\n\nHow do I write queries against the new ClickHouse logs schema? Give a short overview of the key differences from the old BigQuery syntax.`
  }
  return `${intro}\n\nRewrite this query to valid ClickHouse SQL against the new logs schema, preserving its original intent:\n\n\`\`\`sql\n${trimmed}\n\`\`\``
}
