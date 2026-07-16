import dayjs from 'dayjs'

import { DEFAULT_LOG_TYPES, LOG_TYPE_TO_SOURCE } from './UnifiedLogs.constants'
import {
  groupLogsFiltersByColumn,
  parseLogsFilterUrlParams,
  type LogsFilterOperator,
} from './UnifiedLogs.filters'
import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'
import {
  joinSqlFragments,
  analyticsLiteral as lit,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

// Operator fragments for SQL emission. `safeSql` rejects plain strings, so we
// pre-brand the keywords we want to switch between.
const IN_OP = safeSql`IN`
const NOT_IN_OP = safeSql`NOT IN`
const LIKE_OP = safeSql`LIKE`
const NOT_LIKE_OP = safeSql`NOT LIKE`
const ILIKE_OP = safeSql`ILIKE`
const NOT_ILIKE_OP = safeSql`NOT ILIKE`

// Facets the count query is allowed to be invoked for. Reject anything else
// at the entry point rather than letting an unsupported value reach
// `log_attributes[…]` lookups.
const FACET_FIELDS = ['log_type', 'level', 'method', 'status', 'pathname'] as const

// OTEL log_attributes keys for HTTP-style fields. Centralized so they can be
// adjusted in one place if the backend conventions change.
const ATTR = {
  method: safeSql`log_attributes['request.method']`,
  status: safeSql`log_attributes['response.status_code']`,
  path: safeSql`log_attributes['request.path']`,
} as const

// The HTTP status code lives under different OTEL attribute keys per service:
// gateway rows (edge / postgrest / storage / edge function) expose it as
// `response.status_code`, while auth-service rows expose it as `status`. This
// normalizes the two so both the displayed status and the derived severity are
// correct for auth logs (which would otherwise have an empty status and fall
// back to their `severity_text` of INFO, classifying every 4xx/5xx as success).
const HTTP_STATUS_EXPR: SafeLogSqlFragment = safeSql`if(source = 'auth_logs', log_attributes['status'], ${ATTR.status})`

/**
 * Condition that matches rows belonging to a given log_type. Mirrors the
 * shape of the original BigQuery unified-logs CTEs: edge gateway traffic
 * (`source = 'edge_logs'`) is split between `edge`, `postgrest` and `storage`
 * based on URL path. Other types map straight to a single source.
 *
 * The OTEL `postgrest_logs` and `storage_logs` sources contain process-level
 * logs from postgREST / storage-api and are intentionally not part of unified
 * logs; the UI surfaces gateway HTTP traffic for those buckets.
 */
const LOG_TYPE_CONDITION: Record<string, SafeLogSqlFragment> = Object.fromEntries(
  Object.entries(LOG_TYPE_TO_SOURCE).map(([type, source]) => [
    type,
    safeSql`source = ${lit(source)}`,
  ])
)

// Derived `log_type` column for SELECT / GROUP BY / countIf use.
// WHEN source = 'edge_logs' AND ${ATTR.path} LIKE '%/rest/%' THEN 'postgrest'
// WHEN source = 'edge_logs' AND ${ATTR.path} LIKE '%/storage/%' THEN 'storage'
const LOG_TYPE_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN source = 'postgrest_logs' THEN 'postgrest'
      WHEN source = 'storage_logs' THEN 'storage'
      WHEN source = 'edge_logs' THEN 'edge'
      WHEN source = 'postgres_logs' THEN 'postgres'
      WHEN source = 'function_edge_logs' THEN 'edge function'
      WHEN source = 'auth_logs' THEN 'auth'
      WHEN source = 'realtime_logs' THEN 'realtime'
      WHEN source = 'supavisor_logs' THEN 'supavisor'
      WHEN source = 'pgbouncer_logs' THEN 'pgbouncer'
      WHEN source = 'multigres_logs' THEN 'multigres'
      ELSE source
    END`

// Status code is sourced from the HTTP response for gateway-style rows, the
// auth-service `status` attribute for auth rows, and the Postgres
// `parsed.sql_state_code` (e.g. `42P01`) for postgres rows.
const STATUS_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN source = 'postgres_logs' THEN toString(log_attributes['parsed.sql_state_code'])
      ELSE toString((${HTTP_STATUS_EXPR}))
    END`

// SQL expression for derived `level`. Used inline (not as alias reference)
// because the OTEL endpoint can't resolve aliases inside countIf when the
// alias is not in GROUP BY.
//
// HTTP status is checked first so gateway and auth rows (which carry a
// `severity_text` of `INFO` regardless of response code) bucket as
// success/warning/error by status. Postgres-style severity is the
// fallback for rows without a status code.
const LEVEL_EXPR: SafeLogSqlFragment = safeSql`CASE
      WHEN (${HTTP_STATUS_EXPR}) != '' AND toInt32OrZero((${HTTP_STATUS_EXPR})) >= 500 THEN 'error'
      WHEN (${HTTP_STATUS_EXPR}) != '' AND toInt32OrZero((${HTTP_STATUS_EXPR})) BETWEEN 400 AND 499 THEN 'warning'
      WHEN (${HTTP_STATUS_EXPR}) != '' AND toInt32OrZero((${HTTP_STATUS_EXPR})) BETWEEN 200 AND 299 THEN 'success'
      WHEN severity_text IN ('ERROR','FATAL','CRITICAL','ALERT','EMERGENCY') THEN 'error'
      WHEN severity_text IN ('WARN','WARNING') THEN 'warning'
      WHEN severity_text IN ('TRACE','DEBUG','INFO','LOG','NOTICE') THEN 'success'
      ELSE 'success'
    END`

const logTypeWhereCondition = (logTypes: string[]): SafeLogSqlFragment => {
  const effective = logTypes.filter((t) => t in LOG_TYPE_CONDITION)
  const types = effective.length ? effective : [...DEFAULT_LOG_TYPES]
  const branches = types.map((t) => safeSql`(${LOG_TYPE_CONDITION[t]})`)
  return safeSql`(${joinSqlFragments(branches, ' OR ')})`
}

/**
 * Translates one (column, values, operator) group from the parsed `filter` URL
 * param into an underlying SQL condition. The OTEL endpoint rejects queries
 * that reference derived aliases like `log_type` or `level` in WHERE for some
 * shapes, so we always emit raw-column conditions (source/severity_text/
 * log_attributes[…]). For `<>`, IN becomes NOT IN, LIKE becomes NOT LIKE, and
 * multi-value lists are joined with AND so the row must not match *any* value.
 */
const translateFilter = (
  key: string,
  values: readonly string[],
  operator: LogsFilterOperator
): SafeLogSqlFragment | null => {
  if (values.length === 0) return null

  const isNeq = operator === '<>'
  const inOp = isNeq ? NOT_IN_OP : IN_OP
  const likeOp = isNeq ? NOT_LIKE_OP : LIKE_OP
  const joinAndOr = isNeq ? ' AND ' : ' OR '

  const inList = (vals: readonly string[]): SafeLogSqlFragment =>
    safeSql`(${joinSqlFragments(
      vals.map((v) => lit(v)),
      ','
    )})`

  switch (key) {
    case 'log_type': {
      const branches = values.map((t) => {
        const condition = LOG_TYPE_CONDITION[t] ?? safeSql`source = ${lit(t)}`
        return isNeq ? safeSql`NOT (${condition})` : safeSql`(${condition})`
      })
      return safeSql`(${joinSqlFragments(branches, joinAndOr)})`
    }
    case 'level':
      // No simple raw column for level; reference the inline CASE expression.
      return safeSql`(${LEVEL_EXPR}) ${inOp} ${inList(values)}`
    case 'method':
      return safeSql`${ATTR.method} ${inOp} ${inList(values)}`
    case 'status':
      // Match the displayed status: HTTP response code for gateway rows,
      // Postgres SQLSTATE for postgres rows. Inline STATUS_EXPR so e.g.
      // filtering on '00000' picks up postgres success rows.
      return safeSql`(${STATUS_EXPR}) ${inOp} ${inList(values)}`
    case 'pathname':
      return safeSql`(${joinSqlFragments(
        values.map((v) => safeSql`${ATTR.path} ${likeOp} ${lit('%' + v + '%')}`),
        joinAndOr
      )})`
    case 'host':
      // Best-effort: use full request URL since `host` isn't a top-level field.
      return safeSql`(${joinSqlFragments(
        values.map((v) => safeSql`log_attributes['request.url'] ${likeOp} ${lit('%' + v + '%')}`),
        joinAndOr
      )})`
    case 'event_message': {
      // event_message is a top-level column, not a log_attributes key. ILIKE/NOT ILIKE
      // auto-wrap with `%…%` so the user can type "permission denied" as a substring
      // search; explicit `%`s in the input are passed through unchanged. Multiple
      // ILIKE values join with OR (match any); multiple NOT ILIKE values join with AND
      // (the row must contain none of them).
      if (operator === '~~*' || operator === '!~~*') {
        const op = operator === '~~*' ? ILIKE_OP : NOT_ILIKE_OP
        const join = operator === '!~~*' ? ' AND ' : ' OR '
        const pattern = (v: string) => (v.includes('%') ? v : '%' + v + '%')
        return safeSql`(${joinSqlFragments(
          values.map((v) => safeSql`event_message ${op} ${lit(pattern(v))}`),
          join
        )})`
      }
      // = / <> still emit exact match against the column — defensive; the
      // FilterBar doesn't expose them for event_message, but a hand-crafted URL
      // might.
      return safeSql`event_message ${inOp} ${inList(values)}`
    }
    default:
      return safeSql`log_attributes[${lit(key)}] ${inOp} ${inList(values)}`
  }
}

const whereClause = (conditions: SafeLogSqlFragment[]): SafeLogSqlFragment =>
  conditions.length > 0 ? safeSql`WHERE ${joinSqlFragments(conditions, ' AND ')}` : safeSql``

/**
 * Calculates the chart bucketing level (minute/hour/day) given the date range.
 */
const calculateChartBucketing = (
  search: SearchParamsType | Record<string, unknown>
): 'MINUTE' | 'HOUR' | 'DAY' => {
  const dateRange = (search.date as Array<Date | string | number | null | undefined>) || []

  const convertToMillis = (timestamp: Date | string | number | null | undefined) => {
    if (!timestamp) return null
    if (timestamp instanceof Date) return timestamp.getTime()
    if (typeof timestamp === 'string') return dayjs(timestamp).valueOf()
    if (typeof timestamp === 'number') {
      const str = timestamp.toString()
      if (str.length >= 16) return Math.floor(timestamp / 1000)
      return timestamp
    }
    return null
  }

  let startMillis = convertToMillis(dateRange[0])
  let endMillis = convertToMillis(dateRange[1])

  if (!startMillis) startMillis = dayjs().subtract(1, 'hour').valueOf()
  if (!endMillis) endMillis = dayjs().valueOf()

  const startTime = dayjs(startMillis)
  const endTime = dayjs(endMillis)

  const hourDiff = endTime.diff(startTime, 'hour')
  const dayDiff = endTime.diff(startTime, 'day')

  if (dayDiff >= 2) return 'DAY'
  if (hourDiff >= 12) return 'HOUR'
  return 'MINUTE'
}

const truncationFunction = (level: 'MINUTE' | 'HOUR' | 'DAY'): SafeLogSqlFragment => {
  switch (level) {
    case 'DAY':
      return safeSql`toStartOfDay`
    case 'HOUR':
      return safeSql`toStartOfHour`
    case 'MINUTE':
    default:
      return safeSql`toStartOfMinute`
  }
}

/**
 * Returns the projection list for a unified-logs row. All derivations are
 * inlined so the result can be referenced (or filtered) at the same query
 * level — the OTEL endpoint rejects subqueries.
 */
const rowProjection = (): SafeLogSqlFragment => safeSql`
    id,
    null AS source_id,
    timestamp,
    ${LOG_TYPE_EXPR} AS log_type,
    ${STATUS_EXPR} AS status,
    ${LEVEL_EXPR} AS level,
    ${ATTR.path} AS pathname,
    event_message,
    ${ATTR.method} AS method,
    null AS log_count,
    null AS logs
`

const buildBaseWhere = (
  search: QuerySearchParamsType,
  excludeField?: string
): SafeLogSqlFragment[] => {
  const grouped = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter))
  const parts: SafeLogSqlFragment[] = []

  if (excludeField !== 'log_type') {
    const logTypeFilter = grouped.log_type
    if (logTypeFilter) {
      const condition = translateFilter('log_type', logTypeFilter.values, logTypeFilter.operator)
      if (condition) parts.push(condition)
    } else if (!userFilterValue(search)) {
      // Skip the default (postgres|edge) source restriction while the user filter is
      // active — the user clause governs which sources are eligible (auth + postgres),
      // and the default would otherwise exclude auth_logs, the primary attributable source.
      parts.push(logTypeWhereCondition([...DEFAULT_LOG_TYPES]))
    }
  }

  for (const [key, { operator, values }] of Object.entries(grouped)) {
    if (key === excludeField) continue
    if (key === 'log_type') continue // handled above
    try {
      const condition = translateFilter(key, values, operator)
      if (condition) parts.push(condition)
    } catch {
      // analyticsLiteral rejected an unsupported input — drop the condition.
    }
  }

  const searchParamsFilter = applySearchParamsFilter(search)
  if (searchParamsFilter) parts.push(searchParamsFilter)

  return parts
}

// Path substrings that identify which downstream service an `edge_logs`
// (API Gateway) row was routed to. Mirrors the convention already used by
// the sibling Logs Explorer (Logs.constants.ts / Logs.utils.otel.ts) and by
// ServiceFlow.sql.ts within this same feature.
const EDGE_SERVICE_PATH_FILTER: Record<'edge_auth' | 'edge_storage' | 'edge_postgrest', string> = {
  edge_auth: '%/auth/%',
  edge_storage: '%/storage/%',
  edge_postgrest: '%/rest/%',
}

/**
 * Returns view-option WHERE conditions — toggles from the filter sidebar that
 * hide a subset of rows without being a `filter` URL param (Postgres
 * connection lifecycle messages, and per-service traffic nested inside the
 * API Gateway `edge_logs` source). Shared by every query via `buildBaseWhere`,
 * so the row list, chart and sidebar facet counts stay in sync (otherwise the
 * badges over-count by the rows the list hides).
 */
/** Trimmed value of the cross-cutting user filter, or '' when inactive. */
const userFilterValue = (search: QuerySearchParamsType): string =>
  typeof search.user === 'string' ? search.user.trim() : ''

/**
 * Cross-cutting "attributable to one user" condition. Only the two sources that can
 * be positively tied to a user are eligible, each with its own match:
 *   - auth_logs: structured identity (`auth_event.actor_id`)
 *   - postgres_logs: the identifier appears verbatim in the error text (e.g. a 23502
 *     failing row echoing the id column).
 * edge_logs / storage_logs / realtime_logs carry no per-user field and can't satisfy
 * either branch, so they're auto-excluded while the filter is active — never guessed
 * at via IP or timestamp proximity.
 */
const userAttributionCondition = (search: QuerySearchParamsType): SafeLogSqlFragment | null => {
  const value = userFilterValue(search)
  if (!value) return null
  const exact = lit(value)
  const contains = lit('%' + value + '%')
  return safeSql`(
    (source = 'auth_logs' AND (
      log_attributes['auth_event.actor_id'] = ${exact}
      OR event_message ILIKE ${contains}
    ))
    OR (source = 'postgres_logs' AND event_message ILIKE ${contains})
  )`
}

const USER_ATTRIBUTABLE_SOURCES = new Set([LOG_TYPE_TO_SOURCE.auth, LOG_TYPE_TO_SOURCE.postgres])

/**
 * True when the user filter is active but an explicit log_type filter restricts the
 * view to source(s) that can never satisfy `userAttributionCondition` (e.g. `edge`) —
 * the combination is guaranteed to match zero rows. Consumed by the UI to show a
 * specific empty state instead of the generic "No results found".
 *
 * [Joshen] Basically filtering by user only works on Auth and Postgres logs atm
 * Refer to userAttributeCondition above
 */
export const isUserFilterUnreachable = (search: QuerySearchParamsType): boolean => {
  if (!userFilterValue(search)) return false

  const logTypeFilter = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter)).log_type
  if (!logTypeFilter) return false

  const sources = logTypeFilter.values.map(
    (v) => LOG_TYPE_TO_SOURCE[v as keyof typeof LOG_TYPE_TO_SOURCE] ?? v
  )

  if (logTypeFilter.operator === '<>') {
    // Excludes these sources from view — unreachable only if both attributable
    // sources are excluded (excluding just one still leaves the other eligible).
    return [...USER_ATTRIBUTABLE_SOURCES].every((source) => sources.includes(source))
  }

  // Restricts the view to these sources — unreachable unless at least one is attributable.
  return !sources.some((source) => USER_ATTRIBUTABLE_SOURCES.has(source))
}

const applySearchParamsFilter = (search: QuerySearchParamsType): SafeLogSqlFragment | null => {
  const conditions: SafeLogSqlFragment[] = []

  const userCondition = userAttributionCondition(search)
  if (userCondition) conditions.push(userCondition)

  // Visible by default — only an explicit `false` hides connection logs.
  if (search.show_connection_logs === false) {
    conditions.push(safeSql`(source != 'postgres_logs' OR (
      event_message NOT LIKE 'connection received%' AND
      event_message NOT LIKE 'connection authenticated%' AND
      event_message NOT LIKE 'connection authorized%'
    ))`)
  }

  // Visible by default — only an explicit `false` hides that service's
  // requests within the API Gateway log type.
  for (const key of ['edge_auth', 'edge_storage', 'edge_postgrest'] as const) {
    if (search[key] === false) {
      conditions.push(
        safeSql`(source != 'edge_logs' OR ${ATTR.path} NOT LIKE ${lit(EDGE_SERVICE_PATH_FILTER[key])})`
      )
    }
  }

  if (conditions.length === 0) return null
  return safeSql`(${joinSqlFragments(conditions, ' AND ')})`
}

/**
 * Unified logs row query — flat SELECT, no subquery wrapper.
 */
export const getUnifiedLogsQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const conditions = buildBaseWhere(search)
  return safeSql`-- unified logs: row list
SELECT ${rowProjection()}
FROM logs
${whereClause(conditions)}
`
}

/**
 * Single-facet count query — a complete flat SELECT with GROUP BY.
 */
export const getFacetCountQuery = ({
  search,
  facet,
  facetSearch,
}: {
  search: QuerySearchParamsType
  facet: string
  facetSearch?: string
}): SafeLogSqlFragment => {
  if (!(FACET_FIELDS as readonly string[]).includes(facet)) {
    throw new Error('Invalid unified logs facet')
  }

  const MAX_FACETS_QUANTITY = 20

  const facetExpr: SafeLogSqlFragment =
    facet === 'log_type'
      ? LOG_TYPE_EXPR
      : facet === 'level'
        ? LEVEL_EXPR
        : facet === 'method'
          ? ATTR.method
          : facet === 'status'
            ? STATUS_EXPR
            : facet === 'pathname'
              ? ATTR.path
              : safeSql`log_attributes[${lit(facet)}]`

  const conditions: SafeLogSqlFragment[] = [
    ...buildBaseWhere(search, facet),
    safeSql`(${facetExpr}) IS NOT NULL AND (${facetExpr}) != ''`,
  ]
  if (facetSearch) {
    conditions.push(safeSql`(${facetExpr}) LIKE ${lit('%' + facetSearch + '%')}`)
  }

  return safeSql`-- unified logs: single-facet counts (${lit(facet)})
SELECT ${lit(facet)} AS facet, (${facetExpr}) AS value, count() AS count
FROM logs
${whereClause(conditions)}
GROUP BY value
LIMIT ${lit(MAX_FACETS_QUANTITY)}
`
}

/**
 * Builds the facet-count query for the logs sidebar. Each row is
 * (facet, value, count): for one filter category (e.g. level) and one of its
 * values (e.g. warning), how many logs matched. The special `total` facet
 * counts every matching log for the count badge.
 */
export const getLogsCountQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const grouped = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter))

  const whereFor = (excludeField?: string): SafeLogSqlFragment => {
    const conditions = buildBaseWhere(search, excludeField)
    return conditions.length > 0 ? joinSqlFragments(conditions, ' AND ') : safeSql`1`
  }

  const VALUE_EXPR = {
    total: safeSql`'all'`,
    log_type: LOG_TYPE_EXPR,
    level: LEVEL_EXPR,
    method: ATTR.method,
    status: STATUS_EXPR,
  }

  const scanBlock = (
    facets: (keyof typeof VALUE_EXPR)[],
    where: SafeLogSqlFragment
  ): SafeLogSqlFragment => {
    const facetArray = joinSqlFragments(
      facets.map((facet) => lit(facet)),
      ','
    )
    const branches = facets.map((facet) => safeSql`facet = ${lit(facet)}, ${VALUE_EXPR[facet]}`)
    return safeSql`
SELECT
  arrayJoin([${facetArray}]) AS facet,
  multiIf(${joinSqlFragments([...branches, safeSql`''`], ', ')}) AS value,
  count() AS count
FROM logs
WHERE ${where}
GROUP BY facet, value
HAVING value != ''
`
  }

  // log_type always scans alone: excluding it also drops the default-types
  // filter, so its counts differ from the base scan even when unfiltered.
  const blocks = [scanBlock(['log_type'], whereFor('log_type'))]

  // A filtered facet gets its own scan so it can exclude its own filter and
  // still count its other values; the rest share the base scan.
  const baseFacets: (keyof typeof VALUE_EXPR)[] = ['total']
  for (const facet of ['level', 'method', 'status'] as const) {
    if (grouped[facet]) blocks.push(scanBlock([facet], whereFor(facet)))
    else baseFacets.push(facet)
  }
  blocks.push(scanBlock(baseFacets, whereFor()))

  // pathname is high-cardinality, so it needs its own LIMIT (the endpoint
  // rejects LIMIT BY inside the shared arrayJoin).
  blocks.push(safeSql`(${getFacetCountQuery({ search, facet: 'pathname' })})`)

  return safeSql`-- unified logs: sidebar facet counts
${joinSqlFragments(blocks, ' UNION ALL ')}`
}

/**
 * Logs chart query with dynamic bucketing based on time range.
 */
export const getLogsChartQuery = (search: QuerySearchParamsType): SafeLogSqlFragment => {
  const truncationLevel = calculateChartBucketing(search)
  const truncFn = truncationFunction(truncationLevel)
  const conditions = buildBaseWhere(search)

  return safeSql`-- unified logs: severity chart (${truncFn} buckets)
SELECT
  ${truncFn}(timestamp) AS time_bucket,
  countIf((${LEVEL_EXPR}) = 'success') AS success,
  countIf((${LEVEL_EXPR}) = 'warning') AS warning,
  countIf((${LEVEL_EXPR}) = 'error') AS error,
  count() AS total_per_bucket
FROM logs
${whereClause(conditions)}
GROUP BY time_bucket
ORDER BY time_bucket ASC
`
}
