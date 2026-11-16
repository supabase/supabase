import { describe, expect, it } from 'vitest'

import { selectTableRow } from './rowSelection.utils'

const ids = ['a', 'b', 'c', 'd', 'e']

describe('selectTableRow', () => {
  it('replaces selection on plain click, including an already selected row', () => {
    const selected = selectTableRow({ selected: { a: true, c: true } }, ids, 'c')
    expect(selected).toEqual({ selected: { c: true }, anchorId: 'c', activeId: 'c' })
  })

  it('clears selection on plain click of the only selected row', () => {
    const selected = selectTableRow({ selected: {} }, ids, 'c')
    expect(selectTableRow(selected, ids, 'c')).toEqual({ selected: {} })
  })

  it.each([{ metaKey: true }, { ctrlKey: true }, { toggle: true }])(
    'toggles individual rows with %o',
    (modifiers) => {
      const start = selectTableRow({ selected: {} }, ids, 'a')
      const added = selectTableRow(start, ids, 'c', modifiers)
      expect(added.selected).toEqual({ a: true, c: true })
      expect(selectTableRow(added, ids, 'a', modifiers).selected).toEqual({ c: true })
      expect(selectTableRow(added, ids, 'c', modifiers).anchorId).toBe('c')
    }
  )

  it('extends, shrinks, and reverses a range around a fixed anchor', () => {
    const start = selectTableRow({ selected: {} }, ids, 'c')
    const down = selectTableRow(start, ids, 'e', { shiftKey: true })
    expect(down.selected).toEqual({ c: true, d: true, e: true })
    const back = selectTableRow(down, ids, 'd', { shiftKey: true })
    expect(back.selected).toEqual({ c: true, d: true })
    expect(selectTableRow(back, ids, 'a', { shiftKey: true }).selected).toEqual({
      a: true,
      b: true,
      c: true,
    })
    expect(back.anchorId).toBe('c')
  })

  it('keeps a range selected when shift-clicking it again', () => {
    const start = selectTableRow({ selected: {} }, ids, 'a')
    const range = selectTableRow(start, ids, 'c', { shiftKey: true })
    expect(selectTableRow(range, ids, 'c', { shiftKey: true })).toEqual(range)
  })

  it.each([{ metaKey: true }, { ctrlKey: true }])(
    'adds a range to disjoint selection with %o',
    (modifiers) => {
      const start = { selected: { a: true, d: true }, anchorId: 'd' }
      expect(selectTableRow(start, ids, 'e', { shiftKey: true, ...modifiers }).selected).toEqual({
        a: true,
        d: true,
        e: true,
      })
    }
  )

  it('uses the current display order', () => {
    const start = { selected: { a: true }, anchorId: 'a' }
    expect(
      selectTableRow(start, ['e', 'a', 'c', 'b', 'd'], 'b', { shiftKey: true }).selected
    ).toEqual({ a: true, c: true, b: true })
  })

  it.each([undefined, 'missing'])('starts a fresh range when the anchor is %s', (anchorId) => {
    expect(
      selectTableRow({ selected: { a: true }, anchorId }, ids, 'c', { shiftKey: true })
    ).toEqual({ selected: { c: true }, anchorId: 'c', activeId: 'c' })
  })

  it('ignores missing targets and empty results', () => {
    const state = { selected: { a: true } }
    expect(selectTableRow(state, ids, 'missing')).toBe(state)
    expect(selectTableRow(state, [], 'a')).toBe(state)
  })
})
