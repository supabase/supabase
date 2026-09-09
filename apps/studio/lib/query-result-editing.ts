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

export function updateResultRows({
  rows,
  original,
  updated,
  columns,
  table,
}: {
  rows: readonly Record<string, unknown>[]
  original: Record<string, unknown>
  updated: Record<string, unknown>
  columns: NonNullable<EditableQuery['columns']>
  table: ResultTable
}) {
  const identifiers = getResultRowIdentifiers(original, table, columns)
  if (!identifiers) return rows
  return rows.map((row) => {
    const candidate = getResultRowIdentifiers(row, table, columns)
    if (
      !candidate ||
      !Object.entries(identifiers).every(([key, value]) => candidate[key] === value)
    )
      return row
    return Object.fromEntries(columns.map(({ name, column }) => [name, updated[column]]))
  })
}
