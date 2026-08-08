import type { QueryClient } from '@tanstack/react-query'
import { describe, expect, test, vi } from 'vitest'

import { databaseKeys } from '@/data/database/keys'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { lintKeys } from '@/data/lint/keys'
import { tableEditorKeys } from '@/data/table-editor/keys'
import { tableRowKeys } from '@/data/table-rows/keys'
import { tableKeys } from '@/data/tables/keys'
import { invalidateTableMetadata } from '@/data/tables/table-metadata-invalidation'

const createQueryClient = () => {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  } as unknown as QueryClient
}

const getInvalidatedQueryKeys = (queryClient: QueryClient) => {
  return vi.mocked(queryClient.invalidateQueries).mock.calls.map(([filters]) => filters?.queryKey)
}

describe('invalidateTableMetadata', () => {
  test('invalidates table metadata query variants for the current table', async () => {
    const queryClient = createQueryClient()

    await invalidateTableMetadata(queryClient, {
      projectRef: 'project-ref',
      schema: 'public',
      tableId: 1,
      tableName: 'todos',
    })

    const queryKeys = getInvalidatedQueryKeys(queryClient)

    expect(queryKeys).toEqual(
      expect.arrayContaining([
        tableKeys.names('project-ref'),
        entityTypeKeys.list('project-ref'),
        databaseKeys.tableColumnsPrefix('project-ref'),
        tableEditorKeys.tableEditor('project-ref', 1),
        databaseKeys.tableDefinition('project-ref', 1),
        databaseKeys.tableConstraints('project-ref', 1),
        tableKeys.list('project-ref', 'public'),
        tableKeys.infiniteListPrefix('project-ref', 'public'),
        databaseKeys.foreignKeyConstraintsPrefix('project-ref', 'public'),
        tableKeys.retrieve('project-ref', 'todos', 'public'),
      ])
    )
    expect(queryKeys).not.toContainEqual(lintKeys.lint('project-ref'))
    expect(queryKeys).not.toContainEqual(tableRowKeys.tableRowsAndCount('project-ref', 1))
  })

  test('invalidates old and new schema and table keys when a table is moved or renamed', async () => {
    const queryClient = createQueryClient()

    await invalidateTableMetadata(queryClient, {
      projectRef: 'project-ref',
      schema: 'public',
      tableId: 1,
      tableName: 'todos',
      newSchema: 'private',
      newTableName: 'tasks',
      includeRows: true,
      includeLint: true,
    })

    const queryKeys = getInvalidatedQueryKeys(queryClient)

    expect(queryKeys).toEqual(
      expect.arrayContaining([
        tableKeys.list('project-ref', 'public'),
        tableKeys.infiniteListPrefix('project-ref', 'public'),
        databaseKeys.foreignKeyConstraintsPrefix('project-ref', 'public'),
        tableKeys.list('project-ref', 'private'),
        tableKeys.infiniteListPrefix('project-ref', 'private'),
        databaseKeys.foreignKeyConstraintsPrefix('project-ref', 'private'),
        tableKeys.retrieve('project-ref', 'todos', 'public'),
        tableKeys.retrieve('project-ref', 'tasks', 'private'),
        lintKeys.lint('project-ref'),
        tableRowKeys.tableRowsAndCount('project-ref', 1),
      ])
    )
    expect(queryKeys[queryKeys.length - 1]).toEqual(
      tableRowKeys.tableRowsAndCount('project-ref', 1)
    )
  })

  test('only invalidates row keys when rows are requested and a table id is available', async () => {
    const queryClient = createQueryClient()

    await invalidateTableMetadata(queryClient, {
      projectRef: 'project-ref',
      schema: 'public',
      tableName: 'todos',
      includeRows: true,
    })

    expect(getInvalidatedQueryKeys(queryClient)).not.toContainEqual(
      tableRowKeys.tableRowsAndCount('project-ref', 1)
    )
  })
})
