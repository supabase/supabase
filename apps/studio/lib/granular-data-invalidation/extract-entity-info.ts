import type { CreateStmt } from 'libpg-query'

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

function parseCreateFunctionStatement(createFunctionStmt: any): Event | null {
  // Handle function creation - CREATE FUNCTION statements use CreateFunctionStmt
  if (createFunctionStmt.funcname?.length > 0) {
    // funcname is typically an array of String nodes
    const funcNameNode = createFunctionStmt.funcname[createFunctionStmt.funcname.length - 1]
    const funcName = funcNameNode.sval || funcNameNode.str || funcNameNode

    // Schema might be in the first element if qualified name is used
    const schema =
      createFunctionStmt.funcname.length > 1
        ? createFunctionStmt.funcname[0].sval ||
          createFunctionStmt.funcname[0].str ||
          createFunctionStmt.funcname[0]
        : DEFAULT_SCHEMA

    return {
      entityType: 'function',
      schema,
      entityName: funcName,
    }
  }

  return null
}

function parseDropStatement(dropStmt: any): Event | null {
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
