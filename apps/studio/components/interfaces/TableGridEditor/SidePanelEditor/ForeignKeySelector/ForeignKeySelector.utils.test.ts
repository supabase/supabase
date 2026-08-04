import { describe, expect, it } from 'vitest'

import type { ForeignKey } from './ForeignKeySelector.types'
import {
  hasForeignKeySelectorChanges,
  normalizeForeignKeyForDirtyCheck,
} from './ForeignKeySelector.utils'

const BASE_FOREIGN_KEY: ForeignKey = {
  id: 'fk-1',
  name: 'messages_author_id_fkey',
  tableId: 42,
  schema: 'public',
  table: 'profiles',
  columns: [{ source: 'author_id', target: 'id' }],
  deletionAction: 'NO ACTION',
  updateAction: 'NO ACTION',
}

describe('ForeignKeySelector dirty state', () => {
  it('is clean on first open', () => {
    const initialState = normalizeForeignKeyForDirtyCheck(BASE_FOREIGN_KEY)

    expect(hasForeignKeySelectorChanges(initialState, BASE_FOREIGN_KEY)).toBe(false)
  })

  it('is dirty after semantic foreign key changes', () => {
    const initialState = normalizeForeignKeyForDirtyCheck(BASE_FOREIGN_KEY)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        schema: 'storage',
      })
    ).toBe(true)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        table: 'users',
        tableId: 99,
      })
    ).toBe(true)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        columns: [{ source: 'owner_id', target: 'id' }],
      })
    ).toBe(true)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        deletionAction: 'CASCADE',
      })
    ).toBe(true)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        updateAction: 'CASCADE',
      })
    ).toBe(true)
  })

  it('ignores derived column type metadata when checking dirty state', () => {
    const initialState = normalizeForeignKeyForDirtyCheck(BASE_FOREIGN_KEY)

    expect(
      hasForeignKeySelectorChanges(initialState, {
        ...BASE_FOREIGN_KEY,
        columns: [
          {
            source: 'author_id',
            sourceType: 'uuid',
            target: 'id',
            targetType: 'uuid',
          },
        ],
      })
    ).toBe(false)
  })
})
