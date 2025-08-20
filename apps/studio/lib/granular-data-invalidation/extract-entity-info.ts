import type { InvalidationEvent } from '.'

const DEFAULT_SCHEMA = 'public' as const

// Parse SQL using libpg-query
async function parseWithLibPgQuery(
  sql: string,
  sqlLower: string
): Promise<Omit<InvalidationEvent, 'projectRef'> | null> {
  try {
    const { parseQuery } = await import('libpg-query')
    const parsed = await parseQuery(sql)

    if (!parsed?.stmts?.length) return null

    const stmt = parsed.stmts[0].stmt as any

    console.log({ stmt })

    // Handle different statement types
    if (stmt?.CreateStmt) return parseCreateStatement(stmt.CreateStmt)

    if (stmt?.DropStmt) return parseDropStatement(stmt.DropStmt)

    if (
      stmt?.SelectStmt &&
      (sqlLower.includes('cron.schedule') || sqlLower.includes('cron.unschedule'))
    ) {
      return parseCronStatement(sql)
    }

    return null
  } catch (error) {
    console.error('libpg-query parsing failed:', error)
    return null
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
 * Extract entity information from SQL statement
 * Uses libpg-query as the primary parsing method
 */
export async function extractEntityInfo(
  sql: string,
  sqlLower: string
): Promise<Omit<InvalidationEvent, 'projectRef'> | null> {
  return await parseWithLibPgQuery(sql, sqlLower)
}
