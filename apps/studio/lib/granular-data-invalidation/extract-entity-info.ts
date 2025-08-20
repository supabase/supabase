import type { InvalidationEvent } from '.'

const DEFAULT_SCHEMA = 'public' as const

const SQL_PATTERNS = {
  table: /table\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  function: /(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  trigger: /trigger\s+"?(\w+)"?(?:[\s\S]*?on\s+"?(?:(\w+)\.)?"?(\w+)"?)?/i,
  policy: /policy\s+(?:if\s+exists\s+)?(?:"([^"]+)"|(\w+))\s+on\s+(?:"?(\w+)"?\.)??"?(\w+)"?/i,
  index:
    /(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)??"?(\w+)"?(?:\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?)?/i,
  cron: /(?:select\s+)?cron\.(?:schedule|unschedule)\s*\(\s*(?:'([^']+)'|"([^"]+)"|(\d+))/i,
  view: /view\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  schema: /schema\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"([^"]+)"|(\w+))/i,
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
    entityType: 'function',
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
  if (sqlLower.includes(' table ')) {
    return extractTableInfo(sql)
  }

  if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
    return extractFunctionInfo(sql, sqlLower)
  }

  if (sqlLower.includes('cron.schedule') || sqlLower.includes('cron.unschedule')) {
    return extractCronInfo(sql)
  }

  return null
}
