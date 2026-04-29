import type { TableSeedData } from '@/data/rls-sandbox/project-seed-data-query'

interface Executor {
  execSql(sql: string): Promise<void>
}

function serializeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) return `ARRAY[${val.map(serializeValue).join(', ')}]`
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  return `'${String(val).replace(/'/g, "''")}'`
}

function buildInsertSQL(schema: string, table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) throw new Error(`buildInsertSQL requires at least one row`)
  const columns = Object.keys(rows[0])
  const colList = columns.map((c) => `"${c}"`).join(', ')
  const valuesList = rows
    .map((row) => `(${columns.map((c) => serializeValue(row[c])).join(', ')})`)
    .join(',\n  ')
  return `INSERT INTO "${schema}"."${table}" (${colList}) VALUES\n  ${valuesList};`
}

export async function applySeed(sandbox: Executor, tables: TableSeedData[]): Promise<void> {
  // Disable FK triggers so we can delete and re-insert in any order.
  // Requires superuser (ALTER ROLE postgres SUPERUSER in SANDBOX_SETUP_STATEMENTS).
  // Falls back gracefully if the privilege is not available.
  let triggersDisabled = false
  try {
    await sandbox.execSql(`SET session_replication_role = replica`)
    triggersDisabled = true
  } catch {
    // postgres not yet a superuser in this PGlite build — proceed without it
  }

  try {
    // Always clear before inserting so re-seed reflects the latest data.
    for (const { schema, table } of tables) {
      try {
        await sandbox.execSql(`DELETE FROM "${schema}"."${table}"`)
      } catch {
        // table may not exist yet — ignore
      }
    }

    // Retry loop handles any remaining FK ordering constraints.
    let pending = tables.filter((t) => t.rows.length > 0)
    while (pending.length > 0) {
      const failed: TableSeedData[] = []
      for (const entry of pending) {
        try {
          await sandbox.execSql(buildInsertSQL(entry.schema, entry.table, entry.rows))
        } catch {
          failed.push(entry)
        }
      }
      if (failed.length === pending.length) {
        for (const entry of failed) {
          console.warn(`[rls-sandbox] seed skipped ${entry.schema}.${entry.table}: unresolved FK`)
        }
        break
      }
      pending = failed
    }
  } finally {
    if (triggersDisabled) {
      await sandbox.execSql(`SET session_replication_role = DEFAULT`)
    }
  }
}
