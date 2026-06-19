import { FOREIGN_KEY_CASCADE_ACTION, safeSql } from '@supabase/pg-meta'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from './SidePanelEditor.types'
import { createTable } from './SidePanelEditor.utils'

// Define mock functions at module level
const mockExecuteSql = vi.fn()
const mockGetTable = vi.fn()
const mockTrack = vi.fn()
const mockPrefetchEditorTablePage = vi.fn()
const mockToastLoading = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockFetchQuery = vi.fn()

// Setup mocks before imports
vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
  }),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/data/tables/table-retrieve-query', () => ({
  getTable: (...args: unknown[]) => mockGetTable(...args),
  getTableQuery: (...args: unknown[]) => mockGetTable(...args),
}))

vi.mock('@/data/prefetchers/project.$ref.editor.$id', () => ({
  prefetchEditorTablePage: (...args: unknown[]) => mockPrefetchEditorTablePage(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

// Mock SparkBar component used in toast
vi.mock('@/components/ui/SparkBar', () => ({
  default: () => null,
}))

// Helper to create a column field with defaults
const createColumnField = (overrides: Partial<ColumnField> = {}): ColumnField => ({
  id: 'col-1',
  name: 'column',
  table: 'test_table',
  schema: 'public',
  format: 'text',
  check: null,
  comment: null,
  defaultValue: null,
  isNullable: true,
  isUnique: false,
  isArray: false,
  isIdentity: false,
  isPrimaryKey: false,
  isNewColumn: true,
  isEncrypted: false,
  ...overrides,
})

describe('createTable', () => {
  const projectRef = 'test-project-ref'
  const connectionString = 'postgresql://localhost:5432/test'
  const toastId = 'test-toast-id'

  const basePayload = {
    name: 'test_table',
    schema: 'public',
    comment: 'A test table',
  }

  const mockTableResult = {
    id: 123,
    name: 'test_table',
    schema: 'public',
    comment: 'A test table',
    columns: [],
    primary_keys: [],
    relationships: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockExecuteSql.mockResolvedValue({ result: [] })
    mockGetTable.mockResolvedValue(mockTableResult)
    mockTrack.mockReset()
    mockPrefetchEditorTablePage.mockResolvedValue(undefined)
    mockFetchQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        return queryFn({ signal: new AbortController().signal })
      }
      return Promise.resolve(mockTableResult)
    })
  })

  it('should create a basic table with no columns', async () => {
    const result = await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns: [],
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
    expect(mockExecuteSql).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef,
        connectionString,
        queryKey: ['table', 'create-with-columns'],
      })
    )

    // Should show loading toast
    expect(mockToastLoading).toHaveBeenCalledWith(`Creating table ${basePayload.name}...`, {
      id: toastId,
    })

    expect(mockTrack).toHaveBeenCalledWith('table_created', {
      has_generated_policies: false,
      method: 'table_editor',
      schema_name: 'public',
      table_name: 'test_table',
    })

    // Should prefetch the editor table page
    expect(mockPrefetchEditorTablePage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef,
        connectionString,
        id: mockTableResult.id,
      })
    )

    expect(result).toStrictEqual({
      failedPolicies: [],
      table: mockTableResult,
    })
  })

  it('should create a table with RLS enabled', async () => {
    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns: [],
      foreignKeyRelations: [],
      isRLSEnabled: true,
      track: mockTrack,
    })

    const sqlCall = mockExecuteSql.mock.calls[0][0]
    expect(sqlCall.sql).toContain('ENABLE ROW LEVEL SECURITY')

    expect(mockTrack).toHaveBeenCalledWith('table_rls_enabled', {
      method: 'table_editor',
      schema_name: 'public',
      table_name: 'test_table',
    })
  })

  it('should create a table with columns', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        id: 'col-1',
        name: 'id',
        format: 'int8',
        isNullable: false,
        isIdentity: true,
        isPrimaryKey: true,
      }),
      createColumnField({
        id: 'col-2',
        name: 'name',
        format: 'text',
        comment: 'User name',
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    const sqlCall = mockExecuteSql.mock.calls[0][0]
    expect(sqlCall.sql).toContain('ALTER TABLE')
    expect(sqlCall.sql).toContain('ADD COLUMN')
    expect(sqlCall.sql).toContain('ADD PRIMARY KEY')
    expect(sqlCall.sql).toContain('id')
  })

  it('should create a table with composite primary key', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        id: 'col-1',
        name: 'user_id',
        format: 'int8',
        isNullable: false,
        isPrimaryKey: true,
      }),
      createColumnField({
        id: 'col-2',
        name: 'order_id',
        format: 'int8',
        isNullable: false,
        isPrimaryKey: true,
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    const sqlCall = mockExecuteSql.mock.calls[0][0]
    expect(sqlCall.sql).toContain('ADD PRIMARY KEY')
    expect(sqlCall.sql).toContain('user_id')
    expect(sqlCall.sql).toContain('order_id')
  })

  it('should create a table with foreign key relations', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        id: 'col-1',
        name: 'id',
        format: 'int8',
        isNullable: false,
        isIdentity: true,
        isPrimaryKey: true,
      }),
      createColumnField({
        id: 'col-2',
        name: 'user_id',
        format: 'int8',
        isNullable: false,
      }),
    ]

    const foreignKeyRelations: ForeignKey[] = [
      {
        schema: 'public',
        table: 'users',
        columns: [{ source: 'user_id', target: 'id' }],
        deletionAction: FOREIGN_KEY_CASCADE_ACTION.CASCADE,
        updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
      },
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations,
      isRLSEnabled: false,
      track: mockTrack,
    })

    const sqlCall = mockExecuteSql.mock.calls[0][0]
    expect(sqlCall.sql).toContain('ADD FOREIGN KEY')
    expect(sqlCall.sql).toContain('REFERENCES')
    expect(sqlCall.sql).toContain('users')
    expect(sqlCall.sql).toContain('ON DELETE CASCADE')
  })

  it('should create a table with nullable connectionString', async () => {
    await createTable({
      projectRef,
      connectionString: null,
      toastId,
      payload: basePayload,
      columns: [],
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef,
        connectionString: null,
      })
    )
  })

  it('should create table with column having default value', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        name: 'status',
        defaultValue: "'pending'",
        isNullable: false,
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
  })

  it('should create table with unique column', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        name: 'email',
        isNullable: false,
        isUnique: true,
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
  })

  it('should create table with array column', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        name: 'tags',
        isArray: true,
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
  })

  it('should create table with check constraint', async () => {
    const columns: ColumnField[] = [
      createColumnField({
        name: 'age',
        format: 'int4',
        check: safeSql`age >= 0`,
        isNullable: false,
      }),
    ]

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: basePayload,
      columns,
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    expect(mockExecuteSql).toHaveBeenCalledTimes(1)
  })

  it('should propagate SQL execution errors', async () => {
    mockExecuteSql.mockRejectedValue(new Error('SQL execution failed'))

    await expect(
      createTable({
        projectRef,
        connectionString,
        toastId,
        payload: basePayload,
        columns: [],
        foreignKeyRelations: [],
        isRLSEnabled: false,
        track: mockTrack,
      })
    ).rejects.toThrow('SQL execution failed')
  })

  it('should create table in non-public schema', async () => {
    const customSchemaPayload = {
      name: 'custom_table',
      schema: 'private',
      comment: 'A private table',
    }

    await createTable({
      projectRef,
      connectionString,
      toastId,
      payload: customSchemaPayload,
      columns: [],
      foreignKeyRelations: [],
      isRLSEnabled: false,
      track: mockTrack,
    })

    const sqlCall = mockExecuteSql.mock.calls[0][0]
    expect(sqlCall.sql).toMatch(/private\.custom_table|"private"\."custom_table"/)

    expect(mockTrack).toHaveBeenCalledWith(
      'table_created',
      expect.objectContaining({ schema_name: 'private' })
    )
  })
})
