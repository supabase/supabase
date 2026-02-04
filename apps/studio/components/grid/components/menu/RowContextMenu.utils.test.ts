import { describe, expect, test, vi } from 'vitest'

import type { SupaRow, SupaTable } from 'components/grid/types'

import {
  buildDuplicateRowPayload,
  getEnumArrayColumns,
  isLikelyMissingPrimaryKeyError,
  maybeAddGeneratedUuidPrimaryKeyForDuplicate,
} from './RowContextMenu.utils'

const makeTable = (overrides?: Partial<SupaTable>): SupaTable => ({
  id: 1,
  type: 'table' as any,
  name: 'todos',
  schema: 'public',
  comment: null,
  estimateRowCount: 0,
  primaryKey: ['id'],
  uniqueIndexes: [],
  columns: [
    {
      position: 1,
      name: 'id',
      dataType: 'int8',
      format: 'int8',
      isPrimaryKey: true,
      isIdentity: true,
    },
    {
      position: 2,
      name: 'title',
      dataType: 'text',
      format: 'text',
      isNullable: false,
      isUpdatable: true,
    },
    {
      position: 3,
      name: 'note',
      dataType: 'text',
      format: 'text',
      isNullable: true,
      isUpdatable: true,
    },
    {
      position: 4,
      name: 'blob',
      dataType: 'bytea',
      format: 'bytea',
      isNullable: true,
      isUpdatable: true,
    },
    {
      position: 5,
      name: 'generated',
      dataType: 'text',
      format: 'text',
      isNullable: true,
      isUpdatable: false,
    },
    {
      position: 6,
      name: 'created_at',
      dataType: 'timestamptz',
      format: 'timestamptz',
      isNullable: false,
      isUpdatable: true,
      defaultValue: 'now()',
    },
    {
      position: 7,
      name: 'gen_uuid',
      dataType: 'uuid',
      format: 'uuid',
      isNullable: false,
      isUpdatable: true,
      isGeneratable: true,
    },
    {
      position: 8,
      name: 'enum_arr',
      dataType: 'array',
      format: '_text',
      enum: ['a', 'b'],
      isUpdatable: true,
    },
  ],
  ...overrides,
})

describe('RowContextMenu utils', () => {
  test('getEnumArrayColumns returns enum array column names', () => {
    const table = makeTable()
    expect(getEnumArrayColumns(table)).toEqual(['enum_arr'])
  })

  test('buildDuplicateRowPayload omits PK/identity and non-updatable columns', () => {
    const table = makeTable()
    const row: SupaRow = {
      idx: 0,
      id: 123,
      title: 'hello',
      note: null,
      blob: null,
      generated: 'should not copy',
      created_at: '2024-01-01T00:00:00Z',
      gen_uuid: '00000000-0000-0000-0000-000000000000',
      enum_arr: ['a'],
    }

    expect(buildDuplicateRowPayload({ table, row })).toEqual({
      title: 'hello',
      note: null,
      blob: null,
      enum_arr: ['a'],
    })
  })

  test('buildDuplicateRowPayload converts bytea Buffer objects to hex', () => {
    const table = makeTable()
    const row: SupaRow = {
      idx: 0,
      id: 1,
      title: 'x',
      note: null,
      blob: { type: 'Buffer', data: [0, 15, 255] } as any,
      generated: 'y',
      created_at: '2024-01-01T00:00:00Z',
      gen_uuid: '00000000-0000-0000-0000-000000000000',
      enum_arr: [],
    }

    expect(buildDuplicateRowPayload({ table, row }).blob).toBe('\\x000fff')
  })

  test('maybeAddGeneratedUuidPrimaryKeyForDuplicate generates a UUID PK only when needed', () => {
    vi.stubGlobal('crypto', { randomUUID: () => '00000000-0000-0000-0000-000000000000' } as any)

    const table = makeTable({
      primaryKey: ['id'],
      columns: [
        {
          position: 1,
          name: 'id',
          dataType: 'uuid',
          format: 'uuid',
          isPrimaryKey: true,
          isNullable: false,
          isIdentity: false,
          defaultValue: undefined,
        },
        {
          position: 2,
          name: 'title',
          dataType: 'text',
          format: 'text',
          isNullable: false,
          isUpdatable: true,
        },
      ],
    })

    const row: SupaRow = { idx: 0, id: 'old', title: 'hello' }
    const basePayload = buildDuplicateRowPayload({ table, row })

    const res = maybeAddGeneratedUuidPrimaryKeyForDuplicate({ table, payload: basePayload })
    expect(res.generated).toBe(true)
    expect(res.payload).toEqual({
      title: 'hello',
      id: '00000000-0000-0000-0000-000000000000',
    })

    vi.unstubAllGlobals()
  })

  test('isLikelyMissingPrimaryKeyError detects NOT NULL PK errors', () => {
    const table = makeTable({
      columns: [
        {
          position: 1,
          name: 'id',
          dataType: 'uuid',
          format: 'uuid',
          isPrimaryKey: true,
          isNullable: false,
          isIdentity: false,
        },
        ...makeTable().columns.slice(1),
      ],
    })

    expect(
      isLikelyMissingPrimaryKeyError({
        table,
        error: {
          message: 'null value in column "id" violates not-null constraint',
        },
      })
    ).toBe(true)
    expect(
      isLikelyMissingPrimaryKeyError({
        table,
        error: { message: 'some other error' },
      })
    ).toBe(false)
  })
})
