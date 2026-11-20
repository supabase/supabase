// Heuristic (non-AST) helpers used to scope column suggestions to the table(s)
// referenced by the SQL statement the cursor is currently in, e.g. so that
// `select * from colors where |` only suggests `colors`' columns.

export type SqlTableReference = {
  schema?: string
  name: string
  alias?: string
}

export type SqlIdent = {
  isQuoted: boolean
  name: string
}

const CLAUSE_STOP_KEYWORDS =
  'where|group|order|having|limit|offset|union|intersect|except|join|inner|left|right|full|cross|lateral|natural|window|for|returning|set|on|using'

const JOIN_START = '(?:(?:inner|left|right|full|cross|lateral|natural)\\s+(?:outer\\s+)?)?join'

const IDENT = '(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)'

const TABLE_REF_PATTERN = new RegExp(
  `^(${IDENT})(?:\\s*\\.\\s*(${IDENT}))?(?:\\s+(?:as\\s+)?(${IDENT}))?$`,
  'i'
)

function unquoteIdent(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"')
  }
  return trimmed
}

// Splits a comma-separated list of table references on top-level commas only
// (ignores commas nested inside parentheses, e.g. function-call table sources).
function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const char of text) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)
  return parts
}

function parseTableRef(segment: string): SqlTableReference | null {
  const trimmed = segment.trim()
  if (!trimmed || trimmed.startsWith('(')) return null

  const match = trimmed.match(TABLE_REF_PATTERN)
  if (!match) return null

  const [, first, second, alias] = match
  if (second) {
    return {
      schema: unquoteIdent(first),
      name: unquoteIdent(second),
      alias: alias ? unquoteIdent(alias) : undefined,
    }
  }
  return { name: unquoteIdent(first), alias: alias ? unquoteIdent(alias) : undefined }
}

function parseTableRefList(segment: string): SqlTableReference[] {
  return splitTopLevelCommas(segment)
    .map(parseTableRef)
    .filter((ref): ref is SqlTableReference => ref !== null)
}

function matchClauseSegments(statement: string, startPattern: string): string[] {
  const pattern = new RegExp(
    `\\b${startPattern}\\b([\\s\\S]*?)(?=\\b(?:${CLAUSE_STOP_KEYWORDS})\\b|;|$)`,
    'gi'
  )
  const segments: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(statement)) !== null) {
    segments.push(match[1])
    // avoid infinite loops on zero-length matches
    if (match[1].length === 0) pattern.lastIndex++
  }
  return segments
}

// Extracts the table (and join) references from the `FROM`/`JOIN` clauses of
// a single SQL statement. Best-effort: subquery table sources and function
// table sources are skipped rather than mis-parsed.
export function getFromClauseTables(statement: string): SqlTableReference[] {
  const refs: SqlTableReference[] = []

  for (const segment of matchClauseSegments(statement, 'from')) {
    refs.push(...parseTableRefList(segment))
  }
  for (const segment of matchClauseSegments(statement, JOIN_START)) {
    refs.push(...parseTableRefList(segment))
  }

  return refs
}

// Returns the SQL statement that contains `offset`, where statements are
// delimited by semicolons that are not inside a string literal or comment.
export function getStatementAtOffset(sql: string, offset: number): string {
  let start = 0
  let end = sql.length
  let inSingleQuote = false
  let inDoubleQuote = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const next = sql[i + 1]

    if (inLineComment) {
      if (char === '\n') inLineComment = false
      continue
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }
    if (inSingleQuote) {
      if (char === "'") {
        if (next === "'") {
          i++
        } else {
          inSingleQuote = false
        }
      }
      continue
    }
    if (inDoubleQuote) {
      if (char === '"') {
        if (next === '"') {
          i++
        } else {
          inDoubleQuote = false
        }
      }
      continue
    }

    if (char === "'") {
      inSingleQuote = true
    } else if (char === '"') {
      inDoubleQuote = true
    } else if (char === '-' && next === '-') {
      inLineComment = true
      i++
    } else if (char === '/' && next === '*') {
      inBlockComment = true
      i++
    } else if (char === ';') {
      if (i < offset) {
        start = i + 1
      } else {
        end = i
        break
      }
    }
  }

  return sql.slice(start, end)
}

// Filters a list of tables (or table-columns) down to just the ones referenced
// in `refs`, matching on table name (case-insensitive) and, when a ref
// specifies a schema, on schema too.
export function filterTablesByReferences<T extends { schemaname: string; tablename: string }>(
  tables: T[],
  refs: SqlTableReference[]
): T[] {
  if (refs.length === 0) return []

  return tables.filter((table) =>
    refs.some((ref) => {
      if (table.tablename.toLowerCase() !== ref.name.toLowerCase()) return false
      if (ref.schema) return table.schemaname.toLowerCase() === ref.schema.toLowerCase()
      return true
    })
  )
}

// Matches a trailing `ident.` (quoted or unquoted), capturing the identifier.
const TRAILING_DOT_IDENT_PATTERN = new RegExp(`(${IDENT})\\s*\\.\\s*$`)

// Detects an identifier immediately followed by a dot at the very end of the
// text (e.g. `... where c.`), so completion can be scoped to that specific
// alias/table rather than every table referenced in the statement.
export function parseTrailingDotIdent(text: string): SqlIdent | null {
  const match = text.match(TRAILING_DOT_IDENT_PATTERN)
  if (!match) return null

  const raw = match[1]
  return { isQuoted: raw.startsWith('"'), name: unquoteIdent(raw) }
}

// Resolves `ident` (typically the identifier typed right before a dot)
// against `refs`, matching on alias first and falling back to the table's own
// name for un-aliased references — so `c.` after `... customers c` (or
// `customers.` with no alias) both resolve to the `customers` table, but a
// join's other table doesn't leak in.
export function resolveTablesForIdent<T extends { schemaname: string; tablename: string }>(
  tables: T[],
  refs: SqlTableReference[],
  ident: SqlIdent
): T[] {
  const matchingRefs = refs.filter((ref) => {
    const candidate = ref.alias ?? ref.name
    return ident.isQuoted
      ? candidate === ident.name
      : candidate.toLocaleLowerCase() === ident.name.toLocaleLowerCase()
  })
  if (matchingRefs.length === 0) return []

  return tables.filter((table) =>
    matchingRefs.some((ref) => {
      if (table.tablename.toLowerCase() !== ref.name.toLowerCase()) return false
      if (ref.schema) return table.schemaname.toLowerCase() === ref.schema.toLowerCase()
      return true
    })
  )
}
