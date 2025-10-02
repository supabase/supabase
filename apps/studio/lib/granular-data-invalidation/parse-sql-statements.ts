import type { CreateFunctionStmt, CreateStmt, DropStmt, SelectStmt } from 'libpg-query'

import type { Event, InvalidationEvent } from '.'

const DEFAULT_SCHEMA = 'public' as const

/**
 * Parse SQL statements and return all invalidation events
 * Uses libpg-query to handle multiple statements in a single call
 */
export async function parseSqlStatements(
  sql: string,
  projectRef: string
): Promise<InvalidationEvent[]> {
  if (!sql || !projectRef) return []

  const sqlLower = sql.toLowerCase().trim()

  // Check if any statement contains supported actions
  const hasValidAction = ['create ', 'drop ', 'cron.schedule', 'cron.unschedule'].some((action) =>
    sqlLower.includes(action)
  )

  if (!hasValidAction) return []

  try {
    const entityInfos = await parseQuery(sql, sqlLower)

    return entityInfos.map((entityInfo) => ({
      ...entityInfo,
      projectRef,
    }))
  } catch (error) {
    console.error('parseSqlStatements: Error parsing SQL', error)
    return []
  }
}

// Parse SQL using libpg-query - handles multiple statements
export async function parseQuery(sql: string, sqlLower: string): Promise<Event[]> {
  try {
    const { parse } = await import('libpg-query')
    const parsed = await parse(sql)

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
      } else if ('SelectStmt' in stmt) {
        // Check if this is a cron statement by examining the AST
        event = parseCronFromSelectStmt(stmt.SelectStmt)
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

function parseCronFromSelectStmt(selectStmt: SelectStmt): Event | null {
  if (!selectStmt.targetList?.length) return null

  for (const target of selectStmt.targetList) {
    if (!('ResTarget' in target)) continue

    const resTarget = target.ResTarget
    if (!resTarget?.val || !('FuncCall' in resTarget.val)) continue

    const funcCall = resTarget.val.FuncCall
    if (!funcCall?.funcname?.length) continue

    // Check if this is a cron function call
    const funcNameParts: string[] = []
    for (const nameNode of funcCall.funcname) {
      if ('String' in nameNode && nameNode.String?.sval) {
        funcNameParts.push(nameNode.String.sval)
      }
    }

    if (
      funcNameParts.length === 2 &&
      funcNameParts[0] === 'cron' &&
      (funcNameParts[1] === 'schedule' || funcNameParts[1] === 'unschedule')
    ) {
      return {
        entityType: 'cron',
        entityName: funcNameParts[1],
      }
    }
  }

  return null
}
