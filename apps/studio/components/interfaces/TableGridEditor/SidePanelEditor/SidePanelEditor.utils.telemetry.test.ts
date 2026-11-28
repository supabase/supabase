import { FOREIGN_KEY_CASCADE_ACTION } from '@supabase/pg-meta'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from './SidePanelEditor.types'
import { updateColumn, updateTable } from './SidePanelEditor.utils'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import type { SafePostgresColumn } from '@/lib/postgres-types'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const projectRef = 'test-ref'
const connectionString = 'postgresql://localhost:5432/test'
const mockTrack = vi.fn()

const idColumn: SafePostgresColumn = {
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
}

const baseTable: RetrieveTableResult = {
  id: 10,
  name: 'users',
  schema: 'public',
  comment: null,
  rls_enabled: true,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 0,
  size: '0 bytes',
  live_rows_estimate: 0,
  dead_rows_estimate: 0,
  primary_keys: [{ table_id: 10, name: 'id', schema: 'public', table_name: 'users' }],
  relationships: [],
  columns: [idColumn],
}

const arrayColumn: SafePostgresColumn = {
  ...idColumn,
  id: '10.2',
  name: 'tags',
  data_type: 'ARRAY',
  format: '_text',
  is_identity: false,
  identity_generation: null,
}

const existingFk = { id: 99 } as ForeignKeyConstraint

const removedForeignKey: ForeignKey = {
  id: 99,
  name: 'fk_users_org_id',
  schema: 'public',
  table: 'organizations',
  columns: [{ source: 'org_id', target: 'id' }],
  deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  toRemove: true,
}

const idField: ColumnField = {
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
}

const newEmailField: ColumnField = {
  ...idField,
  id: 'new-col-uuid',
  name: 'email',
  format: 'text',
  isPrimaryKey: false,
  isIdentity: false,
  isNullable: true,
  isNewColumn: true,
}

/** Every util here runs its SQL through this endpoint; only the table retrieve needs a result. */
const mockPgMeta = ({ failAddColumn = false } = {}) =>
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const { query } = (await request.json()) as { query: string }
      if (failAddColumn && query.includes('ADD COLUMN')) {
        return HttpResponse.json<APIErrorBody>(
          { message: 'column already exists' },
          { status: 400 }
        )
      }
      if (query.includes('with tables as')) {
        return HttpResponse.json<RetrieveTableResult[]>([baseTable])
      }
      return HttpResponse.json<unknown[]>([])
    },
  })

const updateTableArgs = {
  projectRef,
  connectionString,
  toastId: 'toast',
  table: baseTable,
  foreignKeyRelations: [],
  existingForeignKeyRelations: [],
  track: mockTrack,
}

describe('SidePanelEditor.utils telemetry', () => {
  beforeEach(() => {
    mockTrack.mockClear()
  })

  describe('updateColumn', () => {
    it('falls back to originalColumn for isArray when payload omits type', async () => {
      mockPgMeta()

      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: arrayColumn,
        payload: { name: 'labels' },
        selectedTable: baseTable,
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_column_updated',
        { hasForeignKey: false, isArray: true },
        { project: projectRef }
      )
    })

    it('treats FKs marked toRemove as absent and falls back to existingForeignKeyRelations when relations array is empty', async () => {
      mockPgMeta()

      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: arrayColumn,
        payload: { type: { name: 'text', isArray: false } },
        selectedTable: baseTable,
        foreignKeyRelations: [removedForeignKey],
        existingForeignKeyRelations: [existingFk],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenLastCalledWith(
        'table_column_updated',
        { hasForeignKey: false, isArray: false },
        { project: projectRef }
      )

      await updateColumn({
        projectRef,
        connectionString,
        originalColumn: idColumn,
        payload: { comment: 'updated' },
        selectedTable: baseTable,
        foreignKeyRelations: [],
        existingForeignKeyRelations: [existingFk],
        track: mockTrack,
      })

      expect(mockTrack).toHaveBeenLastCalledWith(
        'table_column_updated',
        { hasForeignKey: true, isArray: false },
        { project: projectRef }
      )
    })
  })

  describe('updateTable', () => {
    it('tracks table_updated with columnCountChanged without double-firing table_column_* events', async () => {
      mockPgMeta()

      await updateTable({ ...updateTableArgs, payload: { name: 'accounts' }, columns: [idField] })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_updated',
        { columnCountChanged: false },
        { project: projectRef }
      )

      mockTrack.mockClear()

      await updateTable({ ...updateTableArgs, payload: {}, columns: [idField, newEmailField] })

      expect(mockTrack).toHaveBeenCalledTimes(1)
      expect(mockTrack).toHaveBeenCalledWith(
        'table_updated',
        { columnCountChanged: true },
        { project: projectRef }
      )
    })

    it('does not track table_updated when adding a column fails', async () => {
      mockPgMeta({ failAddColumn: true })

      const { hasError } = await updateTable({
        ...updateTableArgs,
        payload: {},
        columns: [idField, newEmailField],
      })

      expect(hasError).toBe(true)
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })
})
