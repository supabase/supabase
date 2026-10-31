import { parse } from 'libpg-query'
import { NextApiRequest, NextApiResponse } from 'next'

const getOperation = (stmt: Record<string, unknown>) => {
  if ('SelectStmt' in stmt) return 'SELECT'
  if ('InsertStmt' in stmt) return 'INSERT'
  if ('UpdateStmt' in stmt) return 'UPDATE'
  if ('DeleteStmt' in stmt) return 'DELETE'
}

const getTablesInQuery = (ast: unknown) => {
  const tables: string[] = []

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>

    if ('RangeVar' in obj) {
      const rv = obj.RangeVar as { relname?: string; schemaname?: string }
      if (rv.relname) tables.push(rv.schemaname ? `${rv.schemaname}.${rv.relname}` : rv.relname)
    }

    if ('relation' in obj && obj.relation && typeof obj.relation === 'object') {
      const rv = obj.relation as { relname?: string; schemaname?: string }
      if (rv.relname) tables.push(rv.schemaname ? `${rv.schemaname}.${rv.relname}` : rv.relname)
    }

    for (const value of Object.values(obj)) {
      Array.isArray(value) ? value.forEach(traverse) : traverse(value)
    }
  }

  traverse(ast)
  return [...new Set(tables)].sort((a, b) => a.localeCompare(b))
}

// libpg-query nodes only expose the location of their own leading token (e.g. a BoolExpr's
// location is its "AND"/"OR" operator, not the start of its left operand), and some nodes
// (SortBy) use -1 as an "unset" sentinel. Recursing to the smallest non-negative location in
// a subtree gives the true start of that subtree's text in the original SQL.
const getMinLocation = (node: unknown): number | undefined => {
  if (!node || typeof node !== 'object') return undefined
  const obj = node as Record<string, unknown>
  let min: number | undefined
  const consider = (loc: unknown) => {
    if (typeof loc === 'number' && loc >= 0 && (min === undefined || loc < min)) min = loc
  }
  consider(obj.location)
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) value.forEach((item) => consider(getMinLocation(item)))
    else if (value && typeof value === 'object') consider(getMinLocation(value))
  }
  return min
}

// Clauses that can immediately follow WHERE in each statement type, paired with the keyword
// that introduces them in the original SQL — used to find where the WHERE condition's text
// ends, since libpg-query has no deparser to do this for us.
const FOLLOWING_CLAUSES: Record<string, [field: string, keyword: RegExp][]> = {
  SelectStmt: [
    ['groupClause', /\bgroup\s+by\b/i],
    ['havingClause', /\bhaving\b/i],
    ['windowClause', /\bwindow\b/i],
    ['sortClause', /\border\s+by\b/i],
    ['limitOffset', /\boffset\b/i],
    ['limitCount', /\blimit\b/i],
    ['lockingClause', /\bfor\b/i],
  ],
  UpdateStmt: [['returningList', /\breturning\b/i]],
  DeleteStmt: [['returningList', /\breturning\b/i]],
}

const getWhereClauseText = (sql: string, stmtType: string, stmt: Record<string, unknown>) => {
  const start = getMinLocation(stmt.whereClause)
  if (start === undefined) return null

  const candidateEnds: number[] = []
  for (const [field, keyword] of FOLLOWING_CLAUSES[stmtType] ?? []) {
    const value = stmt[field]
    const node = Array.isArray(value) ? value[0] : value
    if (!node) continue

    // Bound the keyword search to before the clause's own expression when we know where that
    // starts; otherwise (e.g. lockingClause, which carries no location at all) search onward.
    const exprStart = getMinLocation(node)
    const window =
      exprStart !== undefined && exprStart > start ? sql.slice(start, exprStart) : sql.slice(start)
    const match = keyword.exec(window)
    if (match) candidateEnds.push(start + match.index)
    else if (exprStart !== undefined && exprStart > start) candidateEnds.push(exprStart)
  }

  const end =
    candidateEnds.length > 0 ? Math.min(...candidateEnds) : sql.replace(/;\s*$/, '').length
  return sql.slice(start, end).trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { sql } = req.body

    if (typeof sql !== 'string' || sql.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "sql" in request body' })
    }

    const ast = await parse(sql)
    const statementCount = ast.stmts?.length ?? 0
    const stmt = ast.stmts?.[0]?.stmt as Record<string, unknown> | undefined
    const [stmtType, stmtNode] = stmt ? Object.entries(stmt)[0] : []

    const tables = getTablesInQuery(ast)
    const operation = stmt ? getOperation(stmt) : null
    const whereClause =
      stmtType && stmtNode
        ? getWhereClauseText(sql, stmtType, stmtNode as Record<string, unknown>)
        : null

    return res.status(200).json({ tables, operation, whereClause, statementCount })
  } catch (error) {
    const message =
      (error as { sqlDetails?: { message?: string } })?.sqlDetails?.message ??
      (error instanceof Error ? error.message : 'Failed to parse SQL')
    return res.status(400).json({ error: message })
  }
}
