import { expect, it } from 'vitest'

import { QueryDraftState } from './query-draft'

it('rejects a stale agent edit so it cannot overwrite what the user typed, even after edit-and-revert', () => {
  const draft = new QueryDraftState('select 1')
  expect(draft.change('select 2', 0)).toEqual({ sql: 'select 2', revision: 1 })
  // The user edits and then reverts: the text matches, but the revision moved on.
  draft.change('select 3')
  draft.change('select 2')
  expect(() => draft.change('drop table users', 1)).toThrow('query changed')
  expect(draft.sql).toBe('select 2')
  expect(draft.change('select 4', 3)).toEqual({ sql: 'select 4', revision: 4 })
})

it('does not advance the revision when the text is unchanged', () => {
  const draft = new QueryDraftState('select 1')
  expect(draft.change('select 1', 0).revision).toBe(0)
})
