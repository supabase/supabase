import type { DatabaseStatement, TransactionOptions } from '../connection'

const POSTGRES_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export function quoteIdentifier(identifier: string): string {
  if (!POSTGRES_IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Invalid PostgreSQL identifier: ${identifier}`)
  }

  return `"${identifier}"`
}

export function quoteQualifiedIdentifier(tableName: string): string {
  const [schema, name, ...rest] = tableName.split('.')

  if (!schema || !name || rest.length > 0) {
    throw new Error(`Invalid PostgreSQL table name: ${tableName}`)
  }

  return `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`
}

export function normalizeStatement(
  statement: string | DatabaseStatement,
  values?: unknown[]
): DatabaseStatement {
  if (typeof statement === 'string') {
    return { text: statement, values }
  }

  return statement
}

export function buildBeginStatement(options?: TransactionOptions): string {
  const modes: string[] = []
  const isolationLevel = normalizeIsolationLevel(options?.isolation)

  if (isolationLevel) {
    modes.push(`ISOLATION LEVEL ${isolationLevel}`)
  }

  if (options?.readOnly) {
    modes.push('READ ONLY')
  }

  return modes.length === 0 ? 'BEGIN' : `BEGIN ${modes.join(', ')}`
}

export function normalizeIsolationLevel(isolation?: string): string | undefined {
  switch (isolation?.toLowerCase()) {
    case 'read committed':
      return 'READ COMMITTED'
    case 'repeatable read':
      return 'REPEATABLE READ'
    case 'serializable':
      return 'SERIALIZABLE'
    default:
      return undefined
  }
}

export function normalizeStatementTimeoutMs(timeoutMs: number | undefined): number | undefined {
  if (timeoutMs === undefined || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined
  }

  return timeoutMs
}
