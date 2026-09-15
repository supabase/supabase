import type { QueryClient } from '@tanstack/react-query'

import { databaseKeys } from '@/data/database/keys'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { lintKeys } from '@/data/lint/keys'
import { tableEditorKeys } from '@/data/table-editor/keys'
import { tableRowKeys } from '@/data/table-rows/keys'
import { tableKeys } from '@/data/tables/keys'

type InvalidateTableMetadataVariables = {
  projectRef: string | undefined
  schema: string | undefined
  tableId?: number
  tableName?: string
  newSchema?: string
  newTableName?: string
  includeRows?: boolean
  includeLint?: boolean
}

export const invalidateTableMetadata = async (
  queryClient: QueryClient,
  {
    projectRef,
    schema,
    tableId,
    tableName,
    newSchema,
    newTableName,
    includeRows = false,
    includeLint = false,
  }: InvalidateTableMetadataVariables
) => {
  const schemas = Array.from(new Set([schema, newSchema].filter(Boolean))) as string[]
  const tables = [
    { schema, name: tableName },
    { schema: newSchema ?? schema, name: newTableName ?? tableName },
  ].filter((table): table is { schema: string; name: string } => {
    return table.schema !== undefined && table.name !== undefined
  })
  const uniqueTables = tables.filter((table, index) => {
    return (
      tables.findIndex((item) => item.schema === table.schema && item.name === table.name) === index
    )
  })

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: tableKeys.names(projectRef) }),
    queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
    queryClient.invalidateQueries({ queryKey: databaseKeys.tableColumnsPrefix(projectRef) }),
    ...(includeLint
      ? [queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) })]
      : []),
    ...(tableId === undefined
      ? []
      : [
          queryClient.invalidateQueries({
            queryKey: tableEditorKeys.tableEditor(projectRef, tableId),
          }),
          queryClient.invalidateQueries({
            queryKey: databaseKeys.tableDefinition(projectRef, tableId),
          }),
          queryClient.invalidateQueries({
            queryKey: databaseKeys.tableConstraints(projectRef, tableId),
          }),
        ]),
    ...schemas.flatMap((currentSchema) => [
      queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, currentSchema) }),
      queryClient.invalidateQueries({
        queryKey: tableKeys.infiniteListPrefix(projectRef, currentSchema),
      }),
      queryClient.invalidateQueries({
        queryKey: databaseKeys.foreignKeyConstraintsPrefix(projectRef, currentSchema),
      }),
    ]),
    ...uniqueTables.flatMap(({ schema, name }) => [
      queryClient.invalidateQueries({ queryKey: tableKeys.retrieve(projectRef, name, schema) }),
    ]),
  ])

  // Invalidate tableRowsAndCount after tableEditor because row queries use it to build their SQL.
  if (includeRows && tableId !== undefined) {
    await queryClient.invalidateQueries({
      queryKey: tableRowKeys.tableRowsAndCount(projectRef, tableId),
    })
  }
}
