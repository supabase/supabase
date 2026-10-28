import { isEqual } from 'lodash'
import { z } from 'zod'

export const editableQuerySchema = z.object({
  schema: z.string().optional(),
  table: z.string(),
  columns: z.array(z.object({ column: z.string(), name: z.string() })).nullable(),
})

export type EditableQuery = z.infer<typeof editableQuerySchema>

type ResultTable = {
  columns?: readonly { name: string }[]
  primary_keys: readonly { name: string }[]
}

// Accept only direct column projections from one relation. Unknown SELECT features fail
// closed: a matching column name alone never proves that a value identifies a source row.
const selectSchema = z.object({
  stmts: z
    .array(
      z.object({
        stmt: z
          .object({
            SelectStmt: z
              .object({
                targetList: z.array(
                  z.object({
                    ResTarget: z
                      .object({
                        name: z.string().optional(),
                        val: z.object({
                          ColumnRef: z.object({
                            fields: z.array(
                              z.union([
                                z.object({ String: z.object({ sval: z.string() }) }),
                                z.object({ A_Star: z.object({}) }),
                              ])
                            ),
                          }),
                        }),
                        location: z.number().optional(),
                      })
                      .strict(),
                  })
                ),
                fromClause: z
                  .array(
                    z.object({
                      RangeVar: z
                        .object({
                          schemaname: z.string().optional(),
                          relname: z.string(),
                          alias: z.object({ aliasname: z.string() }).strict().optional(),
                          inh: z.boolean().optional(),
                          relpersistence: z.string().optional(),
                          location: z.number().optional(),
                        })
                        .strict(),
                    })
                  )
                  .length(1),
                whereClause: z.unknown().optional(),
                sortClause: z.unknown().optional(),
                limitCount: z.unknown().optional(),
                limitOffset: z.unknown().optional(),
                limitOption: z.string().optional(),
                op: z.literal('SETOP_NONE'),
              })
              .strict(),
          })
          .strict(),
      })
    )
    .length(1),
})

export function getEditableQuery(ast: unknown): EditableQuery | null {
  const parsed = selectSchema.safeParse(ast)
  if (!parsed.success) return null
  const select = parsed.data.stmts[0].stmt.SelectStmt
  const relation = select.fromClause[0].RangeVar
  const columns: NonNullable<EditableQuery['columns']> = []
  for (const { ResTarget: target } of select.targetList) {
    const fields = target.val.ColumnRef.fields
    const last = fields.at(-1)
    const qualifiers = fields
      .slice(0, -1)
      .map((field) => ('String' in field ? field.String.sval : undefined))
    if (qualifiers.length > 2 || qualifiers.some((value) => value === undefined)) return null
    if (
      qualifiers.length === 1 &&
      qualifiers[0] !== (relation.alias?.aliasname ?? relation.relname)
    )
      return null
    if (
      qualifiers.length === 2 &&
      (relation.alias ||
        qualifiers[0] !== relation.schemaname ||
        qualifiers[1] !== relation.relname)
    )
      return null
    if (!last) return null
    if ('A_Star' in last) {
      if (select.targetList.length !== 1 || target.name) return null
      return { schema: relation.schemaname, table: relation.relname, columns: null }
    }
    columns.push({ column: last.String.sval, name: target.name ?? last.String.sval })
  }
  if (columns.length === 0 || new Set(columns.map(({ name }) => name)).size !== columns.length)
    return null
  return { schema: relation.schemaname, table: relation.relname, columns }
}

export function getResultColumnMapping(query: EditableQuery, table: ResultTable) {
  const columns = query.columns ?? (table.columns ?? []).map(({ name }) => ({ name, column: name }))
  const tableColumns = new Set(table.columns?.map(({ name }) => name))
  if (columns.some(({ column }) => !tableColumns.has(column))) return null
  if (
    table.primary_keys.length === 0 ||
    table.primary_keys.some(({ name }) => !columns.some(({ column }) => column === name))
  )
    return null
  return columns
}

export function getResultRowIdentifiers(
  row: Record<string, unknown>,
  table: ResultTable,
  columns: NonNullable<EditableQuery['columns']>
): Record<string, unknown> | null {
  if (table.primary_keys.length === 0) return null
  const identifiers: [string, unknown][] = []
  for (const key of table.primary_keys) {
    const column = columns.find(({ column }) => column === key.name)
    if (!column || !Object.hasOwn(row, column.name)) return null
    const value = row[column.name]
    if (
      value === null ||
      value === undefined ||
      !['string', 'number', 'boolean'].includes(typeof value) ||
      (typeof value === 'number' && !Number.isSafeInteger(value))
    )
      return null
    identifiers.push([key.name, value])
  }
  return Object.fromEntries(identifiers)
}

type ResultColumns = NonNullable<EditableQuery['columns']>

/**
 * A cell change made against a query result and not yet written to the database. It names
 * its table and row by primary key rather than by position in the result, so it stays valid
 * when the query is run again and the rows come back in a different order — or not at all.
 */
export type PendingCellEdit = {
  table: { id: number; schema: string; name: string }
  /** The row's primary key values when the edit was made, keyed by table column. */
  rowIdentifiers: Record<string, unknown>
  /** The table column being changed, which an aliased result column may name differently. */
  columnName: string
  /** What the cell held before it was first edited, so typing it back drops the edit. */
  oldValue: unknown
  newValue: unknown
  enumArrayColumns?: string[]
}

type CellAddress = Pick<PendingCellEdit, 'rowIdentifiers' | 'columnName'> & {
  table: Pick<PendingCellEdit['table'], 'id'>
}

const isSameRow = (
  a: Pick<CellAddress, 'table' | 'rowIdentifiers'>,
  b: Pick<CellAddress, 'table' | 'rowIdentifiers'>
) => a.table.id === b.table.id && isEqual(a.rowIdentifiers, b.rowIdentifiers)

const isSameCell = (a: CellAddress, b: CellAddress) =>
  a.columnName === b.columnName && isSameRow(a, b)

export function findPendingCellEdit(edits: readonly PendingCellEdit[], cell: CellAddress) {
  return edits.find((edit) => isSameCell(edit, cell))
}

/**
 * Adds an edit, replacing any earlier edit to the same cell. The cell keeps its first
 * `oldValue`, so editing a value back to what the database holds drops the edit entirely
 * instead of staging a no-op write.
 */
export function stagePendingCellEdit(
  edits: readonly PendingCellEdit[],
  edit: PendingCellEdit
): PendingCellEdit[] {
  const existing = findPendingCellEdit(edits, edit)
  const staged = { ...edit, oldValue: existing ? existing.oldValue : edit.oldValue }
  const others = edits.filter((candidate) => candidate !== existing)
  if (isEqual(staged.newValue, staged.oldValue)) return others
  return existing
    ? edits.map((candidate) => (candidate === existing ? staged : candidate))
    : [...edits, staged]
}

/**
 * Shows a result as it will read once its pending edits are saved, along with which result
 * columns of each shown row hold an unsaved value.
 */
export function applyPendingCellEdits({
  rows,
  edits,
  table,
  columns,
}: {
  rows: readonly Record<string, unknown>[]
  edits: readonly PendingCellEdit[]
  table: ResultTable & { id: number }
  columns: ResultColumns
}) {
  const editedColumns = new Map<Record<string, unknown>, Set<string>>()
  const tableEdits = edits.filter((edit) => edit.table.id === table.id)
  if (tableEdits.length === 0) return { rows, editedColumns }

  const editedRows = rows.map((row) => {
    const rowIdentifiers = getResultRowIdentifiers(row, table, columns)
    if (!rowIdentifiers) return row
    const rowEdits = tableEdits.filter((edit) => isEqual(edit.rowIdentifiers, rowIdentifiers))
    if (rowEdits.length === 0) return row

    const next = { ...row }
    const names = new Set<string>()
    for (const edit of rowEdits) {
      for (const { name, column } of columns) {
        if (column !== edit.columnName) continue
        next[name] = edit.newValue
        names.add(name)
      }
    }
    editedColumns.set(next, names)
    return next
  })
  return { rows: editedRows, editedColumns }
}

export type EditedRow = {
  table: PendingCellEdit['table']
  /** How the row was identified when it was edited. */
  rowIdentifiers: Record<string, unknown>
  /** How the row is identified once saved, which differs only when a key column was edited. */
  savedIdentifiers: Record<string, unknown>
}

/** The distinct rows a set of edits touches, each with the identity it will have once saved. */
export function getEditedRows(edits: readonly PendingCellEdit[]): EditedRow[] {
  const rows: EditedRow[] = []
  for (const edit of edits) {
    let row = rows.find((candidate) => isSameRow(candidate, edit))
    if (!row) {
      row = {
        table: edit.table,
        rowIdentifiers: edit.rowIdentifiers,
        savedIdentifiers: { ...edit.rowIdentifiers },
      }
      rows.push(row)
    }
    if (Object.hasOwn(row.savedIdentifiers, edit.columnName)) {
      row.savedIdentifiers[edit.columnName] = edit.newValue
    }
  }
  return rows
}

/**
 * Swaps result rows for fresh copies read from their table. Each replacement names the row
 * by the identity it had in the result, so a row whose key was just changed is still found.
 */
export function replaceResultRows({
  rows,
  replacements,
  columns,
  table,
}: {
  rows: readonly Record<string, unknown>[]
  replacements: readonly {
    table: Pick<EditedRow['table'], 'id'>
    rowIdentifiers: Record<string, unknown>
    row: Record<string, unknown>
  }[]
  columns: ResultColumns
  table: ResultTable & { id: number }
}) {
  const tableReplacements = replacements.filter((replacement) => replacement.table.id === table.id)
  if (tableReplacements.length === 0) return rows
  return rows.map((row) => {
    const candidate = getResultRowIdentifiers(row, table, columns)
    if (!candidate) return row
    const replacement = tableReplacements.find(({ rowIdentifiers }) =>
      Object.entries(rowIdentifiers).every(([key, value]) => candidate[key] === value)
    )
    if (!replacement) return row
    return Object.fromEntries(columns.map(({ name, column }) => [name, replacement.row[column]]))
  })
}
