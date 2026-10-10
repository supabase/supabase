import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ColumnField } from './SidePanelEditor.types'
import { updateTable } from './SidePanelEditor.utils'
import { generateTableFieldFromPGTable } from './TableEditor/TableEditor.utils'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import type { UpdateTableBody } from '@/data/tables/table-update-mutation'

const mockExecuteSql = vi.fn()
const mockUpdateDatabaseColumn = vi.fn()
const mockGetTable = vi.fn()
const mockFetchQuery = vi.fn()

vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/data/tables/table-retrieve-query', () => ({
  getTable: (...args: unknown[]) => mockGetTable(...args),
  getTableQuery: (...args: unknown[]) => mockGetTable(...args),
}))

vi.mock('@/data/database-columns/database-column-update-mutation', () => ({
  updateDatabaseColumn: (...args: unknown[]) => mockUpdateDatabaseColumn(...args),
}))

vi.mock('@/data/tables/table-update-mutation', () => ({ updateTable: vi.fn() }))
vi.mock('@/data/tables/table-metadata-invalidation', () => ({ invalidateTableMetadata: vi.fn() }))
vi.mock('@/data/table-editor/table-editor-query', () => ({ prefetchTableEditor: vi.fn() }))
vi.mock('@/data/prefetchers/project.$ref.editor.$id', () => ({ prefetchEditorTablePage: vi.fn() }))

vi.mock('sonner', () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/components/ui/SparkBar', () => ({
  default: () => null,
}))

const createColumn = (attnum: number, name: string) => ({
  id: `1.${attnum}`,
  schema: 'public',
  table: 'memberships',
  name,
  data_type: 'integer',
  format: 'int4',
  default_value: null,
  check: null,
  comment: null,
  is_identity: false,
  is_nullable: false,
  is_unique: false,
})

const createTable = (columnNames: string[], primaryKeyNames: string[]) =>
  ({
    id: 1,
    schema: 'public',
    name: 'memberships',
    comment: null,
    rls_enabled: false,
    columns: columnNames.map((name, index) => createColumn(index + 1, name)),
    primary_keys: primaryKeyNames.map((name) => ({ name })),
    relationships: [],
  }) as unknown as RetrieveTableResult

const saveTable = (
  table: RetrieveTableResult,
  columns: ColumnField[],
  payload: UpdateTableBody = {}
) =>
  updateTable({
    projectRef: 'test-project-ref',
    connectionString: null,
    toastId: 'test-toast-id',
    table,
    payload,
    columns,
    foreignKeyRelations: [],
    existingForeignKeyRelations: [],
    primaryKey: { id: 1, name: 'memberships_pkey', type: 'p' },
    track: vi.fn(),
  })

const executedSql = () => mockExecuteSql.mock.calls.map(([{ sql }]) => String(sql).trim())

describe('updateTable primary keys', () => {
  beforeEach(() => {
    mockExecuteSql.mockReset()
    mockExecuteSql.mockResolvedValue({ result: [] })
    mockUpdateDatabaseColumn.mockReset()
    mockGetTable.mockReset()
    mockFetchQuery.mockImplementation(({ queryFn }) =>
      queryFn({ signal: new AbortController().signal })
    )
  })

  it('does not drop the primary key when a primary key column is renamed', async () => {
    const table = createTable(['id', 'name'], ['id'])
    mockGetTable.mockResolvedValue(table)
    const { columns } = generateTableFieldFromPGTable(table, [])
    columns[0] = { ...columns[0], name: 'uid' }

    await saveTable(table, columns)

    expect(executedSql()).toEqual([])
    expect(mockUpdateDatabaseColumn).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ name: 'uid' }) })
    )
  })

  it('does not drop a composite primary key declared in a different order than its columns', async () => {
    const table = createTable(['a', 'b'], ['b', 'a'])
    mockGetTable.mockResolvedValue(table)
    const { columns } = generateTableFieldFromPGTable(table, [])

    await saveTable(table, columns, { comment: 'team memberships' })

    expect(executedSql()).toEqual([])
  })

  it('keeps the existing key order when a column is added to the primary key', async () => {
    const table = createTable(['a', 'b', 'c'], ['b', 'a'])
    mockGetTable.mockResolvedValue(table)
    const { columns } = generateTableFieldFromPGTable(table, [])
    columns[2] = { ...columns[2], isPrimaryKey: true }

    await saveTable(table, columns)

    expect(executedSql()).toEqual([
      'ALTER TABLE public.memberships DROP CONSTRAINT memberships_pkey',
      'ALTER TABLE public.memberships ADD PRIMARY KEY (b, a, c)',
    ])
  })

  it('re-adds the remaining columns when a column is removed from the primary key', async () => {
    const table = createTable(['a', 'b'], ['b', 'a'])
    mockGetTable.mockResolvedValue(table)
    const { columns } = generateTableFieldFromPGTable(table, [])
    columns[0] = { ...columns[0], isPrimaryKey: false }

    await saveTable(table, columns)

    expect(executedSql()).toEqual([
      'ALTER TABLE public.memberships DROP CONSTRAINT memberships_pkey',
      'ALTER TABLE public.memberships ADD PRIMARY KEY (b)',
    ])
  })

  it('uses the new name when a renamed column is added to the primary key', async () => {
    const table = createTable(['a', 'b'], ['a'])
    mockGetTable.mockResolvedValue(table)
    const { columns } = generateTableFieldFromPGTable(table, [])
    columns[1] = { ...columns[1], name: 'b2', isPrimaryKey: true }

    await saveTable(table, columns)

    expect(executedSql()).toEqual([
      'ALTER TABLE public.memberships DROP CONSTRAINT memberships_pkey',
      'ALTER TABLE public.memberships ADD PRIMARY KEY (a, b2)',
    ])
  })
})
