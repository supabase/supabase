import { parse } from 'libpg-query'
import { NextApiRequest, NextApiResponse } from 'next'

const getOperation = async (sql: string) => {
  const ast = await parse(sql)
  const stmt = ast.stmts?.[0]?.stmt

  if (!stmt) return null

  if ('SelectStmt' in stmt) return 'SELECT'
  if ('InsertStmt' in stmt) return 'INSERT'
  if ('UpdateStmt' in stmt) return 'UPDATE'
  if ('DeleteStmt' in stmt) return 'DELETE'
}

const getTablesInQuery = async (sql: string) => {
  const ast = await parse(sql)
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

    const tables = await getTablesInQuery(sql)
    const operation = await getOperation(sql)
    return res.status(200).json({ tables, operation })
  } catch (error) {
    const message =
      (error as { sqlDetails?: { message?: string } })?.sqlDetails?.message ??
      (error instanceof Error ? error.message : 'Failed to parse SQL')
    return res.status(400).json({ error: message })
  }
}
