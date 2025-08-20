import type { InvalidationEvent } from '.'

const DEFAULT_SCHEMA = 'public' as const

// Parse SQL using libpg-query - handles multiple statements
async function parseWithLibPgQuery(
  sql: string,
  sqlLower: string
): Promise<Omit<InvalidationEvent, 'projectRef'>[]> {
  try {
    const { parseQuery } = await import('libpg-query')
    const parsed = await parseQuery(sql)

    if (!parsed?.stmts?.length) return []

    const events: Omit<InvalidationEvent, 'projectRef'>[] = []

    // Process all statements, not just the first one
    for (const stmtWrapper of parsed.stmts) {
      const stmt = stmtWrapper.stmt as any
      let event: Omit<InvalidationEvent, 'projectRef'> | null = null

      console.log({ stmt })

      // Handle different statement types
      if (stmt?.CreateStmt) {
        event = parseCreateStatement(stmt.CreateStmt)
      } else if (stmt?.DropStmt) {
        event = parseDropStatement(stmt.DropStmt)
      } else if (
        stmt?.SelectStmt &&
        (sqlLower.includes('cron.schedule') || sqlLower.includes('cron.unschedule'))
      ) {
        // For cron, we need to parse the original SQL to get the job name
        // since libpg-query doesn't provide structured access to function arguments
        const stmtSql = sql.substring(
          stmtWrapper.stmt_location || 0,
          stmtWrapper.stmt_len ? (stmtWrapper.stmt_location || 0) + stmtWrapper.stmt_len : undefined
        )
        event = parseCronStatement(stmtSql || sql)
      }

      if (event) {
        events.push(event)
      }
    }

    return events
  } catch (error) {
    console.error('libpg-query parsing failed:', error)
    return []
  }
}

function parseCreateStatement(createStmt: any): Omit<InvalidationEvent, 'projectRef'> | null {
  // Handle table creation
  if (createStmt.relation) {
    const schema = createStmt.relation.schemaname || DEFAULT_SCHEMA
    const table = createStmt.relation.relname
    return {
      entityType: 'table',
      schema,
      table,
      entityName: table,
    }
  }

  // Handle function creation
  if (createStmt.funcname?.length > 0) {
    const funcName = createStmt.funcname[0]
    const schema = funcName.schemaname || DEFAULT_SCHEMA
    const name = funcName.relname || funcName.objname
    return {
      entityType: 'function',
      schema,
      entityName: name,
    }
  }

  return null
}

function parseDropStatement(dropStmt: any): Omit<InvalidationEvent, 'projectRef'> | null {
  if (!dropStmt.objects?.length) return null

  // Handle table drop
  if (dropStmt.removeType === 'OBJECT_TABLE') {
    const obj = dropStmt.objects[0]
    const schema = obj[0]?.schemaname || DEFAULT_SCHEMA
    const table = obj[obj.length - 1]?.relname || obj[obj.length - 1]?.objname
    return {
      entityType: 'table',
      schema,
      table,
      entityName: table,
    }
  }

  // Handle function drop
  if (dropStmt.removeType === 'OBJECT_FUNCTION') {
    const obj = dropStmt.objects[0]
    const schema = obj[0]?.schemaname || DEFAULT_SCHEMA
    const funcName = obj[obj.length - 1]?.relname || obj[obj.length - 1]?.objname
    return {
      entityType: 'function',
      schema,
      entityName: funcName,
    }
  }

  return null
}

function parseCronStatement(sql: string): Omit<InvalidationEvent, 'projectRef'> | null {
  // For cron statements, use simple regex to extract the job name since libpg-query
  // might not provide structured access to function arguments
  const cronMatch = sql.match(
    /(?:select\s+)?cron\.(?:schedule|unschedule)\s*\(\s*(?:'([^']+)'|"([^"]+)"|(\d+))/i
  )
  if (!cronMatch) return null

  return {
    entityType: 'cron',
    entityName: cronMatch[1] || cronMatch[2] || cronMatch[3],
  }
}

/**
 * Extract entity information from SQL statement(s)
 * Uses libpg-query to handle multiple statements in a single call
 */
export async function extractEntityInfo(
  sql: string,
  sqlLower: string
): Promise<Omit<InvalidationEvent, 'projectRef'>[]> {
  return await parseWithLibPgQuery(sql, sqlLower)
}
