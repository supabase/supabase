import { FOREIGN_KEY_CASCADE_ACTION } from '@supabase/pg-meta'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from './SidePanelEditor.types'
import { createColumn, updateColumn, updateTable } from './SidePanelEditor.utils'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import type { SafePostgresColumn } from '@/lib/postgres-types'

const mockCreateDatabaseColumn = vi.fn()
const mockUpdateDatabaseColumn = vi.fn()
const mockDeleteDatabaseColumn = vi.fn()
const mockUpdateTableMutation = vi.fn()
const mockExecuteSql = vi.fn()
const mockGetTable = vi.fn()
const mockPrefetchTableEditor = vi.fn()
const mockInvalidateTableMetadata = vi.fn()
const mockFetchQuery = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockTrack = vi.fn()

vi.mock('@/data/query-client', () => ({
  getQueryClient: () => ({
    fetchQuery: mockFetchQuery,
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock('@/data/database-columns/database-column-create-mutation', () => ({
  createDatabaseColumn: (...args: unknown[]) => mockCreateDatabaseColumn(...args),
}))

vi.mock('@/data/database-columns/database-column-update-mutation', () => ({
  updateDatabaseColumn: (...args: unknown[]) => mockUpdateDatabaseColumn(...args),
}))

vi.mock('@/data/database-columns/database-column-delete-mutation', () => ({
  deleteDatabaseColumn: (...args: unknown[]) => mockDeleteDatabaseColumn(...args),
}))

vi.mock('@/data/tables/table-update-mutation', () => ({
  updateTable: (...args: unknown[]) => mockUpdateTableMutation(...args),
}))

vi.mock('@/data/sql/execute-sql-mutation', () => ({
  executeSql: (...args: unknown[]) => mockExecuteSql(...args),
}))

vi.mock('@/data/tables/table-retrieve-query', () => ({
  getTable: (...args: unknown[]) => mockGetTable(...args),
  getTableQuery: (...args: unknown[]) => mockGetTable(...args),
}))

vi.mock('@/data/table-editor/table-editor-query', () => ({
  prefetchTableEditor: (...args: unknown[]) => mockPrefetchTableEditor(...args),
}))

vi.mock('@/data/tables/table-metadata-invalidation', () => ({
  invalidateTableMetadata: (...args: unknown[]) => mockInvalidateTableMetadata(...args),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const projectRef = 'test-ref'
const connectionString = 'postgresql://localhost:5432/test'

const baseTable = {
  id: 10,
  name: 'users',
  schema: 'public',
  comment: null,
  rls_enabled: true,
  primary_keys: [{ name: 'id' }],
  relationships: [],
  columns: [
    {
      id: '10.1',
      table_id: 10,
      schema: 'public',
      table: 'users',
      name: 'id',
      ordinal_position: 1,
      data_type: 'bigint',
      format: 'int8',
      is_identity: true,
      identity_generation: 'BY DEFAULT',
      is_generated: false,
      is_nullable: false,
      is_updatable: true,
      is_unique: false,
      check: null,
      default_value: null,
      enums: [],
      comment: null,
    },
  ],
} as unknown as RetrieveTableResult

const sampleForeignKey: ForeignKey = {
  id: 99,
  name: 'fk_users_org_id',
  schema: 'public',
  table: 'organizations',
  columns: [{ source: 'org_id', target: 'id' }],
  deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
}

const makeColumnField = (overrides: Partial<ColumnField> = {}): ColumnField => ({
  id: '10.1',
  name: 'id',
  table: 'users',
  schema: 'public',
  format: 'int8',
  check: null,
  comment: null,
  defaultValue: null,
  isNullable: false,
  isUnique: false,
  isArray: false,
  isIdentity: true,
  isPrimaryKey: true,
  isNewColumn: false,
  isEncrypted: false,
  ...overrides,
})

describe('SidePanelEditor.utils telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateDatabaseColumn.mockResolvedValue([])
    mockUpdateDatabaseColumn.mockResolvedValue([])
    mockDeleteDatabaseColumn.mockResolvedValue([])
    mockUpdateTableMutation.mockResolvedValue(baseTable)
    mockExecuteSql.mockResolvedValue({ result: [] })
    mockGetTable.mockResolvedValue(baseTable)
    mockPrefetchTableEditor.mockResolvedValue(baseTable)
    mockInvalidateTableMetadata.mockResolvedValue(undefined)
    mockInvalidateQueries.mockResolvedValue(undefined)
    mockFetchQuery.mockImplementation(({ queryFn }) =>
      queryFn ? queryFn({ signal: new AbortController().signal }) : Promise.resolve(baseTable)
    )
  })

  describe('createColumn', () => {
    const createPayload = {
      schema: 'public',
      table: 'users',
      name: 'org_id',
      type: { name: 'int8', isArray: false },
      isPrimaryKey: false,
    } satisfies Parameters<typeof createColumn>[0]['payload']

    it('tracks table_column_created against the column project once the foreign keys are saved', async () => {
      await createColumn({
        projectRef,
        connectionString,
        payload: createPayload,
        selectedTable: baseTable,
        foreignKeyRelations: [sampleForeignKey],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_column_created',
        { hasForeignKey: true, isArray: false },
        { project: projectRef }
      )
    })

    it('does not track when creating the column fails', async () => {
      mockCreateDatabaseColumn.mockRejectedValueOnce(new Error('column already exists'))

      const { error } = await createColumn({
        projectRef,
        connectionString,
        payload: createPayload,
        selectedTable: baseTable,
        track: mockTrack,
      })

      expect(error).toBeDefined()
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('updateColumn', () => {
    const arrayColumn = {
      ...baseTable.columns![0],
      id: '10.2',
      name: 'tags',
      data_type: 'ARRAY',
      format: '_text',
    } as unknown as SafePostgresColumn

    it('preserves isArray from originalColumn when payload omits type', async () => {
      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: arrayColumn,
        payload: { name: 'labels' },
        selectedTable: baseTable,
        foreignKeyRelations: [],
        existingForeignKeyRelations: [],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_column_updated',
        {
          hasForeignKey: false,
          isArray: true,
        },
        { project: projectRef }
      )
    })

    it('treats FKs marked toRemove as absent and falls back to existingForeignKeyRelations when relations array is empty', async () => {
      const existingFk = { id: 99 } as ForeignKeyConstraint

      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: arrayColumn,
        payload: { type: { name: 'text', isArray: false } },
        selectedTable: baseTable,
        foreignKeyRelations: [{ ...sampleForeignKey, toRemove: true }],
        existingForeignKeyRelations: [existingFk],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenLastCalledWith(
        'table_column_updated',
        {
          hasForeignKey: false,
          isArray: false,
        },
        { project: projectRef }
      )

      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: baseTable.columns![0] as unknown as SafePostgresColumn,
        payload: { comment: 'updated' },
        selectedTable: baseTable,
        foreignKeyRelations: [],
        existingForeignKeyRelations: [existingFk],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenLastCalledWith(
        'table_column_updated',
        {
          hasForeignKey: true,
          isArray: false,
        },
        { project: projectRef }
      )
    })
  })

  describe('updateTable', () => {
    it('tracks table_updated with columnCountChanged without double-firing table_column_* events', async () => {
      await updateTable({
        projectRef,
        connectionString,
        toastId: 'toast-1',
        table: baseTable,
        payload: { name: 'accounts' },
        columns: [makeColumnField()],
        foreignKeyRelations: [],
        existingForeignKeyRelations: [],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_updated',
        {
          columnCountChanged: false,
        },
        { project: projectRef }
      )

      mockTrack.mockClear()

      await updateTable({
        projectRef,
        connectionString,
        toastId: 'toast-2',
        table: baseTable,
        payload: {},
        columns: [
          makeColumnField(),
          makeColumnField({
            id: 'new-col-uuid',
            name: 'email',
            format: 'text',
            isPrimaryKey: false,
            isIdentity: false,
            isNullable: true,
            isNewColumn: true,
          }),
        ],
        foreignKeyRelations: [],
        existingForeignKeyRelations: [],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_updated',
        {
          columnCountChanged: true,
        },
        { project: projectRef }
      )
    })

    it('does not track table_updated when adding a column fails', async () => {
      mockCreateDatabaseColumn.mockRejectedValueOnce(new Error('column already exists'))

      const { hasError } = await updateTable({
        projectRef,
        connectionString,
        toastId: 'toast-3',
        table: baseTable,
        payload: {},
        columns: [
          makeColumnField(),
          makeColumnField({
            id: 'new-col-uuid',
            name: 'email',
            format: 'text',
            isPrimaryKey: false,
            isIdentity: false,
            isNullable: true,
            isNewColumn: true,
          }),
        ],
        foreignKeyRelations: [],
        existingForeignKeyRelations: [],
        track: mockTrack,
      })

      expect(hasError).toBe(true)
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })
})
