import type { InvalidationEvent } from '.'

const DEFAULT_SCHEMA = 'public' as const

const SQL_PATTERNS = {
  table: /table\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  function: /(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  trigger: /trigger\s+"?(\w+)"?(?:[\s\S]*?on\s+"?(?:(\w+)\.)?"?(\w+)"?)?/i,
  policy: /policy\s+(?:"([^"]+)"|(\w+))\s+on\s+(?:"?(\w+)"?\.)??"?(\w+)"?/i,
  index:
    /(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+(?:not\s+)?exists\s+)?"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  cron: /(?:select\s+)?cron\.(?:schedule|unschedule)\s*\(\s*(?:'([^']+)'|"([^"]+)"|(\d+))/i,
  view: /view\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
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

function extractIndexInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.index)
  if (!match) return null

  return {
    entityType: 'index',
    schema: match[2] || DEFAULT_SCHEMA,
    table: match[3],
    entityName: match[1],
  }
}

function extractViewInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.view)
  if (!match) return null

  return {
    entityType: 'view',
    schema: match[1] || DEFAULT_SCHEMA,
    entityName: match[2],
  }
}

function extractCronInfo(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.cron)
  if (!match) return null

  return {
    entityType: 'cron',
    entityName: match[1] || match[2] || match[3], // match[1] for single quotes, match[2] for double quotes, match[3] for numeric ID
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

  if (sqlLower.includes(' index ')) {
    return extractIndexInfo(sql)
  }

  if (sqlLower.includes('cron.schedule') || sqlLower.includes('cron.unschedule')) {
    return extractCronInfo(sql)
  }

  if (sqlLower.includes(' view ')) {
    return extractViewInfo(sql)
  }

  return null
}
