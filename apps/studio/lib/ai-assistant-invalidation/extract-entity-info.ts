import type { InvalidationEvent } from './invalidate-cache-granularly'

const DEFAULT_SCHEMA = 'public' as const

// SQL pattern matchers for different entity types
const SQL_PATTERNS = {
  table: /table\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  function: /(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  trigger: /trigger\s+"?(\w+)"?(?:[\s\S]*?on\s+"?(?:(\w+)\.)?"?(\w+)"?)?/i,
  policy: /policy\s+(?:"([^"]+)"|(\w+))\s+on\s+(?:"?(\w+)"?\.)??"?(\w+)"?/i,
} as const

function extractTableInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.table)
  if (!match) return null

  return {
    entityType: 'table',
    schema: match[1] || DEFAULT_SCHEMA,
    table: match[2],
    entityName: match[2],
  }
}

function extractFunctionInfo(
  sql: string,
  sqlLower: string
): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.function)
  if (!match) return null

  return {
    entityType: sqlLower.includes('function') ? 'function' : 'procedure',
    schema: match[1] || DEFAULT_SCHEMA,
    entityName: match[2],
  }
}

function extractTriggerInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.trigger)
  if (!match) return null

  // match[1] is the trigger name
  // match[2] is schema (optional)
  // match[3] is table name
  const schema = match[2] || DEFAULT_SCHEMA
  const table = match[3]

  return {
    entityType: 'trigger',
    schema,
    table,
    entityName: match[1],
  }
}

function extractPolicyInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.policy)
  if (!match) return null

  return {
    entityType: 'policy',
    schema: match[3] || DEFAULT_SCHEMA,
    table: match[4],
    entityName: match[1] || match[2], // match[1] for quoted names, match[2] for unquoted
  }
}

/**
 * Extract entity information from SQL statement
 */
export function extractEntityInfo(
  sql: string,
  sqlLower: string
): Omit<InvalidationEvent, 'projectRef'> | null {
  // Check trigger first since it might contain 'function' in EXECUTE FUNCTION clause
  if (sqlLower.includes(' trigger ')) {
    return extractTriggerInfo(sql)
  }

  if (sqlLower.includes(' table ')) {
    return extractTableInfo(sql)
  }

  if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
    return extractFunctionInfo(sql, sqlLower)
  }

  if (sqlLower.includes(' policy ')) {
    return extractPolicyInfo(sql)
  }

  return null
}
