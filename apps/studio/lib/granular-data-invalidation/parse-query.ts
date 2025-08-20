import type { CreateFunctionStmt, CreateStmt, DropStmt } from 'libpg-query'

import type { Event } from '.'

const DEFAULT_SCHEMA = 'public' as const

// Parse SQL using libpg-query - handles multiple statements
export async function parseQuery(sql: string, sqlLower: string): Promise<Event[]> {
  try {
    const { parseQuery } = await import('libpg-query')
    const parsed = await parseQuery(sql)

    if (!parsed?.stmts?.length) return []

    const events: Event[] = []

    // Process all statements
    for (const stmtWrapper of parsed.stmts) {
      const stmt = stmtWrapper.stmt

      let event: Event | null = null

      if (!stmt) continue

      // Handle different statement types
      if ('CreateStmt' in stmt) {
        event = parseCreateStatement(stmt.CreateStmt)
      } else if ('CreateFunctionStmt' in stmt) {
        event = parseCreateFunctionStatement(stmt.CreateFunctionStmt)
      } else if ('DropStmt' in stmt) {
        event = parseDropStatement(stmt.DropStmt)
      } else if (
        'SelectStmt' in stmt &&
        (sqlLower.includes('cron.schedule') || sqlLower.includes('cron.unschedule'))
      ) {
        // For cron, we need to parse the original SQL to get the job name
        // since libpg-query doesn't provide structured access to function arguments
        const stmtSql = sql.substring(
          stmtWrapper.stmt_location || 0,
          stmtWrapper.stmt_len ? (stmtWrapper.stmt_location || 0) + stmtWrapper.stmt_len : undefined
        )
        event = parseCronStatement(stmtSql || sql)
      } else {
        // Get the statement type for logging
        const stmtType = Object.keys(stmt)[0]
        console.log('Unhandled statement type:', stmtType)
      }

      if (event) events.push(event)
    }

    return events
  } catch (error) {
    console.error('libpg-query parsing failed:', error)
    return []
  }
}

function parseCreateStatement(createStmt: CreateStmt): Event | null {
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

  return null
}

function parseCreateFunctionStatement(createFunctionStmt: CreateFunctionStmt): Event | null {
  if (createFunctionStmt.funcname?.length && createFunctionStmt.funcname?.length > 0) {
    const funcNameNode = createFunctionStmt.funcname[createFunctionStmt.funcname.length - 1]

    if (!('String' in funcNameNode)) return null

    const funcName = funcNameNode.String.sval
    if (!funcName) return null

    const schema =
      createFunctionStmt.funcname.length > 1 && 'String' in createFunctionStmt.funcname[0]
        ? createFunctionStmt.funcname[0].String.sval
        : DEFAULT_SCHEMA

    return {
      entityType: 'function',
      schema,
      entityName: funcName,
    }
  }

  return null
}

function parseDropStatement(dropStmt: DropStmt): Event | null {
  if (!dropStmt.objects?.length) return null

  // Handle table drop
  if (dropStmt.removeType === 'OBJECT_TABLE') {
    const firstObj = dropStmt.objects[0]
    if (!('List' in firstObj)) return null

    const listItems = firstObj.List?.items
    if (!listItems) return null

    const parts: string[] = []
    for (const node of listItems) {
      if ('String' in node && node.String?.sval) {
        parts.push(node.String.sval)
      }
    }

    const table = parts[parts.length - 1]
    const schema = parts.length > 1 ? parts[0] : DEFAULT_SCHEMA
    if (!table) return null

    return {
      entityType: 'table',
      schema,
      table,
      entityName: table,
    }
  }

  // Handle function drop
  if (dropStmt.removeType === 'OBJECT_FUNCTION') {
    const firstObj = dropStmt.objects[0]
    if (!('ObjectWithArgs' in firstObj)) return null

    const objWithArgs = firstObj.ObjectWithArgs
    if (!objWithArgs?.objname) return null

    const parts: string[] = []
    for (const node of objWithArgs.objname) {
      if ('String' in node && node.String?.sval) {
        parts.push(node.String.sval)
      }
    }

    const funcName = parts[parts.length - 1]
    const schema = parts.length > 1 ? parts[0] : DEFAULT_SCHEMA
    if (!funcName) return null

    return {
      entityType: 'function',
      schema,
      entityName: funcName,
    }
  }

  return null
}

function parseCronStatement(sql: string): Event | null {
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
