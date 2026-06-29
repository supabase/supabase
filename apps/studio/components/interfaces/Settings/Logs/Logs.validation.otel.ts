import { findNodes, parse, ParseError, type Statement } from '@clickhouse/parser'

import { KNOWN_OTEL_SOURCES, OTEL_LOG_COLUMNS, OTEL_LOGS_TABLE } from './Logs.utils.otel'

// Client-side validation for the ClickHouse-backed (OTEL) log explorer. Parses
// the query with @clickhouse/parser so we can (1) surface syntax errors, (2)
// reject anything that isn't a read-only SELECT before it reaches the endpoint,
// and (3) hint at schema mistakes (unknown sources/columns) without blocking.

export interface LogQueryIssue {
  message: string
  // 1-based position of the problem in the query, when the parser knows it.
  line?: number
  column?: number
}

export interface LogQueryValidation {
  errors: LogQueryIssue[]
  warnings: LogQueryIssue[]
}

const EMPTY: LogQueryValidation = { errors: [], warnings: [] }

// Statement kinds that only read data. Anything else (INSERT, ALTER, DROP,
// CREATE, SYSTEM, ...) is rejected.
const READ_ONLY_STATEMENT_KINDS = new Set(['select', 'union', 'intersect'])

// Readable labels for the statement kinds we reject, so the error names the
// operation the user actually wrote.
const STATEMENT_LABELS: Record<string, string> = {
  insert: 'INSERT',
  update: 'UPDATE',
  delete: 'DELETE',
  drop: 'DROP',
  truncate: 'TRUNCATE',
  rename: 'RENAME',
  optimize: 'OPTIMIZE',
  attach: 'ATTACH',
  detach: 'DETACH',
  system: 'SYSTEM',
  grant: 'GRANT',
  kill: 'KILL',
  set: 'SET',
  use: 'USE',
  explain: 'EXPLAIN',
  describe: 'DESCRIBE',
  show: 'SHOW',
}

const labelForKind = (kind: string): string => {
  if (STATEMENT_LABELS[kind]) return STATEMENT_LABELS[kind]
  if (kind.startsWith('create')) return 'CREATE'
  if (kind.startsWith('alter')) return 'ALTER'
  return kind.toUpperCase()
}

const isStringIdentifier = (value: unknown): value is string => typeof value === 'string'

const toParseIssue = (error: unknown): LogQueryIssue => {
  const message = error instanceof Error ? error.message : 'Could not parse query.'
  if (error instanceof ParseError && error.location) {
    return {
      message: `Syntax error: ${message}`,
      line: error.location.start.line,
      column: error.location.start.column,
    }
  }
  return { message: `Syntax error: ${message}` }
}

// `FROM edge_logs` is a common mistake carried over from the BigQuery explorer,
// where each source was its own table. Point users at the single `logs` table.
// Names introduced by WITH ... AS (...) clauses. They appear as table and
// column references in the AST but aren't real schema objects, so the source
// and column checks below must ignore them.
const collectCteNames = (statements: Statement[]): Set<string> => {
  const names = new Set<string>()
  for (const cte of findNodes(statements, 'cteSubquery')) {
    if (isStringIdentifier(cte.name)) names.add(cte.name)
  }
  for (const cte of findNodes(statements, 'cteExpr')) {
    if (isStringIdentifier(cte.name)) names.add(cte.name)
  }
  return names
}

const checkSourceTables = (statements: Statement[], cteNames: Set<string>): LogQueryIssue[] => {
  const issues: LogQueryIssue[] = []
  for (const ref of findNodes(statements, 'tableRef')) {
    if (
      isStringIdentifier(ref.table) &&
      !cteNames.has(ref.table) &&
      KNOWN_OTEL_SOURCES.includes(ref.table)
    ) {
      issues.push({
        message: `Logs live in the "${OTEL_LOGS_TABLE}" table. Use "FROM ${OTEL_LOGS_TABLE} WHERE source = '${ref.table}'" instead of "FROM ${ref.table}".`,
        line: ref.location?.start.line,
        column: ref.location?.start.column,
      })
    }
  }
  return issues
}

const isSourceColumn = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const ref = node as { kind?: string; parts?: unknown[] }
  return (
    ref.kind === 'columnRef' &&
    Array.isArray(ref.parts) &&
    ref.parts.length === 1 &&
    ref.parts[0] === 'source'
  )
}

const stringLiteralValue = (node: unknown): string | null => {
  if (!node || typeof node !== 'object') return null
  const literal = node as { kind?: string; type?: string; value?: unknown }
  if (
    literal.kind === 'literal' &&
    literal.type === 'String' &&
    typeof literal.value === 'string'
  ) {
    return literal.value
  }
  return null
}

// Warn when a `source = '...'` / `source IN (...)` filter compares against a
// value that isn't a known source, so typos surface before an empty result.
const checkSourceValues = (statements: Statement[]): LogQueryIssue[] => {
  const issues: LogQueryIssue[] = []
  const flagged = new Set<string>()

  const flag = (node: unknown) => {
    const value = stringLiteralValue(node)
    if (value === null || KNOWN_OTEL_SOURCES.includes(value) || flagged.has(value)) return
    flagged.add(value)
    issues.push({
      message: `Unknown log source "${value}". Known sources: ${KNOWN_OTEL_SOURCES.join(', ')}.`,
    })
  }

  for (const expr of findNodes(statements, 'binaryExpr')) {
    if (expr.op !== '=') continue
    if (isSourceColumn(expr.left)) flag(expr.right)
    if (isSourceColumn(expr.right)) flag(expr.left)
  }

  for (const expr of findNodes(statements, 'inExpr')) {
    // `source NOT IN (...)` excludes values, so an unknown one isn't a typo.
    if (expr.negated || !isSourceColumn(expr.expr) || !Array.isArray(expr.values)) continue
    for (const value of expr.values) flag(value)
  }

  return issues
}

// Warn on bare column references that aren't real columns on the `logs` table.
// Aliases defined in the query are allowed, and qualified/multi-part references
// are skipped to avoid false positives on joins, subqueries and tuples.
const checkColumns = (statements: Statement[], cteNames: Set<string>): LogQueryIssue[] => {
  const issues: LogQueryIssue[] = []

  const aliases = new Set<string>()
  for (const alias of findNodes(statements, 'alias')) {
    if (isStringIdentifier(alias.alias)) aliases.add(alias.alias)
  }

  const known = new Set<string>(OTEL_LOG_COLUMNS)
  for (const name of cteNames) known.add(name)
  const flagged = new Set<string>()

  for (const ref of findNodes(statements, 'columnRef')) {
    if (ref.parts.length !== 1) continue
    const name = ref.parts[0]
    if (!isStringIdentifier(name)) continue
    if (known.has(name) || aliases.has(name) || flagged.has(name)) continue
    flagged.add(name)
    issues.push({
      message: `Unknown column "${name}". Available columns: ${OTEL_LOG_COLUMNS.join(', ')}. Read custom fields with log_attributes['${name}'].`,
      line: ref.location?.start.line,
      column: ref.location?.start.column,
    })
  }

  return issues
}

const collectSchemaWarnings = (statements: Statement[]): LogQueryIssue[] => {
  const cteNames = collectCteNames(statements)
  return [
    ...checkSourceTables(statements, cteNames),
    ...checkSourceValues(statements),
    ...checkColumns(statements, cteNames),
  ]
}

export function validateOtelLogQuery(sql: string): LogQueryValidation {
  const trimmed = (sql ?? '').trim()
  if (!trimmed) return EMPTY

  let statements: Statement[]
  try {
    statements = parse(trimmed)
  } catch (error) {
    return { errors: [toParseIssue(error)], warnings: [] }
  }

  // Trailing semicolons parse to no-op `empty` statements; ignore them so a
  // stray ";" doesn't read as an unsupported statement.
  const realStatements = statements.filter((statement) => statement.kind !== 'empty')
  if (realStatements.length === 0) return EMPTY

  const errors: LogQueryIssue[] = []

  if (realStatements.length > 1) {
    errors.push({
      message:
        'Only a single query can be run at a time. Remove the extra statements separated by ";".',
    })
  }

  for (const statement of realStatements) {
    if (!READ_ONLY_STATEMENT_KINDS.has(statement.kind)) {
      errors.push({
        message: `Only SELECT queries are allowed in the log explorer. ${labelForKind(statement.kind)} statements are not supported.`,
      })
    }
  }

  // Once the query is rejected, schema hints would just be noise.
  if (errors.length > 0) return { errors, warnings: [] }

  return { errors, warnings: collectSchemaWarnings(realStatements) }
}
