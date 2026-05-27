import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockExecuteSql = vi.fn()
const mockFetchQuery = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockPrefetchTableEditor = vi.fn()
const mockToastError = vi.fn()
const mockUpdateTableMutation = vi.fn()
const mockGetTable = vi.fn()

vi.mock('@supabase/pg-meta', () => ({
  default: {},
  getAddForeignKeySQL: vi.fn(() => 'alter table add foreign key'),
  getAddPrimaryKeySQL: vi.fn(() => 'alter table add primary key'),
  getDropConstraintSQL: vi.fn(() => 'alter table drop constraint'),
  getDuplicateIdentitySequenceSQL: vi.fn(() => ''),
  getDuplicateRowsSQL: vi.fn(() => ''),
  getDuplicateTableSQL: vi.fn(() => ''),
  getEnableRLSSQL: vi.fn(() => ''),
  getRemoveForeignKeySQL: vi.fn(() => 'alter table drop foreign key'),
  getUpdateIdentitySequenceSQL: vi.fn(() => ''),
}))

vi.mock('@supabase/pg-meta/src/query', () => ({
  Query: class {
    private schema = ''
    private table = ''

    from(table: string, schema: string) {
      this.table = table
      this.schema = schema
      return this
    }

    insert() {
      return this
    }

    toSql() {
      return `insert into ${this.schema}.${this.table}`
    }
  },
}))

vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/data/sql/execute-sql-query', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/data/table-editor/table-editor-query', () => ({
  prefetchTableEditor: (...args: unknown[]) => mockPrefetchTableEditor(...args),
}))

vi.mock('@/data/tables/table-retrieve-query', () => ({
  getTable: (...args: unknown[]) => mockGetTable(...args),
}))

vi.mock('@/data/tables/table-update-mutation', () => ({
  updateTable: (...args: unknown[]) => mockUpdateTableMutation(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    info: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('@/components/ui/SparkBar', () => ({
  default: () => null,
}))

import { insertTableRows, updateTable } from './SidePanelEditor.utils'

describe('SidePanelEditor mutation utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvalidateQueries.mockResolvedValue(undefined)
    mockUpdateTableMutation.mockResolvedValue(undefined)
    mockGetTable.mockResolvedValue(undefined)
  })

  it('marks table updates as partial failures when foreign key updates fail', async () => {
    const updatedTable = {
      id: 42,
      name: 'demo',
      schema: 'public',
      columns: [],
      primary_keys: [],
    }

    mockFetchQuery.mockResolvedValue(updatedTable)
    mockPrefetchTableEditor.mockResolvedValue(updatedTable)
    mockExecuteSql.mockRejectedValueOnce(new Error('referenced columns must be unique'))

    const result = await updateTable({
      projectRef: 'project-ref',
      connectionString: 'postgresql://localhost:5432/postgres',
      toastId: 'toast-id',
      table: {
        id: 42,
        name: 'demo',
        schema: 'public',
        columns: [],
        primary_keys: [],
      } as any,
      payload: {},
      columns: [],
      foreignKeyRelations: [
        {
          id: 'new-fk',
          name: 'demo_parent_name_fkey',
          source_schema: 'public',
          source_table_name: 'demo',
          source_column_name: 'parent_name',
          target_table_schema: 'public',
          target_table_name: 'parent_no_pk',
          target_column_name: 'name',
        },
      ] as any,
      existingForeignKeyRelations: [],
      primaryKey: undefined,
    })

    expect(result).toEqual({
      table: updatedTable,
      hasError: true,
    })
    expect(mockToastError).toHaveBeenCalledWith(
      'Failed to update foreign key constraints: referenced columns must be unique'
    )
    expect(mockPrefetchTableEditor).toHaveBeenCalled()
  })

  it('waits for inserts to finish before resolving a successful import', async () => {
    let resolveInsert: (() => void) | undefined
    const insertFinished = new Promise<void>((resolve) => {
      resolveInsert = resolve
    })

    mockExecuteSql.mockImplementation(() => insertFinished)

    const onProgressUpdate = vi.fn()
    let settled = false

    const pendingImport = insertTableRows({
      projectRef: 'project-ref',
      connectionString: 'postgresql://localhost:5432/postgres',
      table: {
        id: 7,
        name: 'slow_import',
        schema: 'public',
        columns: [],
      } as any,
      rows: [{ id: 1, payload: 'test' }],
      selectedHeaders: ['id', 'payload'],
      onProgressUpdate,
    }).then((result) => {
      settled = true
      return result
    })

    await Promise.resolve()
    await Promise.resolve()

    expect(settled).toBe(false)
    expect(onProgressUpdate).not.toHaveBeenCalled()

    resolveInsert?.()

    await expect(pendingImport).resolves.toEqual({ error: undefined })
    expect(onProgressUpdate).toHaveBeenCalledWith(100)
  })
})
