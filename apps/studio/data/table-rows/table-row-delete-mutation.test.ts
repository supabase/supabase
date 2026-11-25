import { describe, expect, it } from 'vitest'

import { getTableRowDeleteSql } from './table-row-delete-mutation'
import type { Entity } from '@/data/table-editor/table-editor-types'

function createTable(primaryKeys: string[]): Entity {
  return {
    id: 1,
    name: 'user_roles',
    schema: 'public',
    entity_type: 'r',
    primary_keys: primaryKeys.map((name) => ({ name, schema: 'public', table_name: 'user_roles' })),
  } as unknown as Entity
}

describe('getTableRowDeleteSql', () => {
  it('deletes by a single primary key with an in list', () => {
    const sql = String(
      getTableRowDeleteSql({
        table: createTable(['id']),
        rows: [
          { idx: 0, id: 1 },
          { idx: 1, id: 2 },
        ],
      })
    )

    expect(sql).toBe('delete from public.user_roles where id in (1,2);')
  })

  it('deletes only the selected rows when the primary key is composite', () => {
    const sql = String(
      getTableRowDeleteSql({
        table: createTable(['user_id', 'role_id']),
        rows: [
          { idx: 0, user_id: 1, role_id: 'admin' },
          { idx: 1, user_id: 2, role_id: 'viewer' },
        ],
      })
    )

    // Must match the row tuples, not each column independently. Matching
    // columns independently would also delete (1, 'viewer') and (2, 'admin').
    expect(sql).toBe(
      "delete from public.user_roles where (user_id, role_id) in ((1, 'admin'), (2, 'viewer'));"
    )
  })
})
