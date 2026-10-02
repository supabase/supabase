import type { BasicPgClient, Migration } from 'postgres-migrations/dist/types'

const IDENTIFIER_START = /[A-Za-z_]/u
const IDENTIFIER_CONTINUATION = /[A-Za-z0-9_$]/u
const DOLLAR_TAG_CONTINUATION = /[A-Za-z0-9_]/u
const IDENTIFIER = String.raw`(?:"(?:[^"]|"")*"|[A-Za-z_][A-Za-z0-9_$]*)`
const CONCURRENT_INDEX_CREATE_START = /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/giu
const CONCURRENT_INDEX_CREATE = new RegExp(
  String.raw`\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<index>${IDENTIFIER})\s+ON\s+(?:ONLY\s+)?(?<table>${IDENTIFIER}(?:\s*\.\s*${IDENTIFIER})?)`,
  'giu'
)

interface ConcurrentIndexTarget {
  indexName: string
  tableReference: string
}

interface IndexState {
  schema_name: string
  index_name: string
  indisvalid: boolean | null
  on_table: boolean | null
}

export interface RepairedConcurrentIndex {
  schemaName: string
  indexName: string
}

// A failed CREATE INDEX CONCURRENTLY can leave an invalid index behind.
// A retry with IF NOT EXISTS would otherwise skip the build and record
// the migration as complete. Remove only the invalid index targeted by
// the pending migration.
export async function repairInvalidConcurrentIndexes(
  client: BasicPgClient,
  migration: Migration
): Promise<RepairedConcurrentIndex[]> {
  const targets = concurrentIndexTargets(migration.sql)
  const repaired: RepairedConcurrentIndex[] = []

  for (const target of targets) {
    const result = await client.query({
      text: `
        SELECT
          n.nspname AS schema_name,
          c.relname AS index_name,
          i.indisvalid,
          i.indrelid = pg_catalog.to_regclass($1) AS on_table
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
        WHERE c.relname = $2
          AND c.relnamespace = (
            SELECT relnamespace
            FROM pg_catalog.pg_class
            WHERE oid = pg_catalog.to_regclass($1)
          )
      `,
      values: [target.tableReference, target.indexName],
    })

    const state = result.rows[0] as IndexState | undefined
    if (!state) {
      continue
    }

    if (state.on_table === true && state.indisvalid === true) {
      continue
    }

    if (state.on_table === true && state.indisvalid === false) {
      await client.query(
        `DROP INDEX CONCURRENTLY IF EXISTS ${escapeAndQuoteIdentifier(
          state.schema_name
        )}.${escapeAndQuoteIdentifier(state.index_name)}`
      )
      repaired.push({
        schemaName: state.schema_name,
        indexName: state.index_name,
      })
      continue
    }

    throw new Error(
      `Cannot repair concurrent index ${target.indexName}: its name is used by a different relation`
    )
  }

  return repaired
}

function concurrentIndexTargets(sql: string): ConcurrentIndexTarget[] {
  const source = skipSqlLiteralsAndComments(sql)
  const targets = Array.from(source.matchAll(CONCURRENT_INDEX_CREATE), (match) => ({
    indexName: unquoteIdentifier(match.groups?.index ?? ''),
    tableReference: match.groups?.table ?? '',
  }))
  const concurrentCreates = source.match(CONCURRENT_INDEX_CREATE_START)?.length ?? 0

  if (targets.length !== concurrentCreates) {
    throw new Error('Cannot determine the target of a concurrent index migration')
  }

  return targets
}

// Preserve quoted identifiers and replace comments and literals with spaces.
function skipSqlLiteralsAndComments(sql: string): string {
  const source: string[] = []
  let copyStart = 0
  let position = 0

  while (position < sql.length) {
    const character = sql[position]
    let end: number | undefined

    if (sql.startsWith('--', position)) {
      end = skipLineComment(sql, position + 2)
    } else if (sql.startsWith('/*', position)) {
      end = skipBlockComment(sql, position + 2)
    } else if (character === "'") {
      end = skipSingleQuotedString(sql, position)
    } else if (character === '$') {
      const delimiter = dollarQuoteDelimiter(sql, position)
      if (delimiter) {
        const closingDelimiter = sql.indexOf(delimiter, position + delimiter.length)
        end = closingDelimiter === -1 ? sql.length : closingDelimiter + delimiter.length
      }
    } else if (character === '"') {
      position = skipQuotedIdentifier(sql, position)
      continue
    }

    if (end === undefined) {
      position++
      continue
    }

    source.push(sql.slice(copyStart, position), ' ')
    position = end
    copyStart = end
  }

  source.push(sql.slice(copyStart))
  return source.join('')
}

function skipLineComment(sql: string, start: number): number {
  let position = start
  while (position < sql.length && sql[position] !== '\n' && sql[position] !== '\r') {
    position++
  }
  return position
}

function skipBlockComment(sql: string, start: number): number {
  let depth = 1
  let position = start

  while (position < sql.length && depth > 0) {
    if (sql.startsWith('/*', position)) {
      depth++
      position += 2
    } else if (sql.startsWith('*/', position)) {
      depth--
      position += 2
    } else {
      position++
    }
  }

  return position
}

function skipSingleQuotedString(sql: string, start: number): number {
  const escapeBackslashes =
    (sql[start - 1] === 'E' || sql[start - 1] === 'e') &&
    (start < 2 || !IDENTIFIER_CONTINUATION.test(sql[start - 2]))
  let position = start + 1

  while (position < sql.length) {
    if (escapeBackslashes && sql[position] === '\\') {
      position += 2
    } else if (sql[position] === "'" && sql[position + 1] === "'") {
      position += 2
    } else if (sql[position] === "'") {
      return position + 1
    } else {
      position++
    }
  }

  return position
}

function dollarQuoteDelimiter(sql: string, start: number): string | undefined {
  if (start > 0 && IDENTIFIER_CONTINUATION.test(sql[start - 1])) {
    return undefined
  }

  let position = start + 1
  if (sql[position] === '$') {
    return '$$'
  }

  if (!IDENTIFIER_START.test(sql[position] ?? '')) {
    return undefined
  }

  position++
  while (position < sql.length && DOLLAR_TAG_CONTINUATION.test(sql[position])) {
    position++
  }

  return sql[position] === '$' ? sql.slice(start, position + 1) : undefined
}

function skipQuotedIdentifier(sql: string, start: number): number {
  let position = start + 1

  while (position < sql.length) {
    if (sql[position] === '"' && sql[position + 1] === '"') {
      position += 2
    } else if (sql[position] === '"') {
      return position + 1
    } else {
      position++
    }
  }

  return position
}

function unquoteIdentifier(identifier: string): string {
  if (identifier.startsWith('"')) {
    return identifier.slice(1, -1).replaceAll('""', '"')
  }

  return identifier.toLowerCase()
}

function escapeAndQuoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`
}
