import type { CreateFunctionStmt, CreateStmt, DropStmt } from 'libpg-query'

import type { Event } from '.'

const DEFAULT_SCHEMA = 'public' as const

// Parse SQL using libpg-query - handles multiple statements
async function parseWithLibPgQuery(sql: string, sqlLower: string): Promise<Event[]> {
  try {
    const { parseQuery } = await import('libpg-query')
    const parsed = await parseQuery(sql)

    if (!parsed?.stmts?.length) return []

    const events: Event[] = []

    // Process all statements, not just the first one
    for (const stmtWrapper of parsed.stmts) {
      const stmt = stmtWrapper.stmt as any

      let event: Event | null = null

      // Handle different statement types
      if (stmt?.CreateStmt) {
        event = parseCreateStatement(stmt.CreateStmt)
      } else if (stmt?.CreateFunctionStmt) {
        event = parseCreateFunctionStatement(stmt.CreateFunctionStmt)
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
      } else {
        console.log('Unhandled statement type:', Object.keys(stmt || {}))
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

/**
 * Extract entity information from SQL statement(s)
 * Uses libpg-query to handle multiple statements in a single call
 */
export async function extractEntityInfo(sql: string, sqlLower: string): Promise<Event[]> {
  return await parseWithLibPgQuery(sql, sqlLower)
}
