import { describe, expect, it } from 'vitest'

import { selectLogRows } from './log-selection'

const ids = ['a', 'b', 'c', 'd']

describe('selectLogRows follows file-explorer selection', () => {
  it('selects one row on click and toggles individual rows with Cmd/Ctrl', () => {
    expect(selectLogRows(ids, ['a', 'c'], 'a', 'b')).toEqual({ selected: ['b'], anchor: 'b' })
    expect(selectLogRows(ids, ['a'], 'a', 'c', { toggle: true })).toEqual({
      selected: ['a', 'c'],
      anchor: 'c',
    })
    expect(selectLogRows(ids, ['a', 'c'], 'c', 'a', { toggle: true }).selected).toEqual(['c'])
    expect(selectLogRows(ids, ['a'], 'a', 'a', { toggle: true })).toEqual({
      selected: [],
      anchor: null,
    })
  })

  it('extends and contracts a Shift range without moving the anchor', () => {
    const expanded = selectLogRows(ids, ['b'], 'b', 'd', { shift: true })
    expect(expanded).toEqual({ selected: ['b', 'c', 'd'], anchor: 'b' })
    expect(selectLogRows(ids, expanded.selected, expanded.anchor, 'c', { shift: true })).toEqual({
      selected: ['b', 'c'],
      anchor: 'b',
    })
    expect(selectLogRows(ids, ['b'], 'b', 'a', { shift: true }).selected).toEqual(['a', 'b'])
  })

  it('starts a Shift range at the clicked row after the selection was cleared or filtered away', () => {
    expect(selectLogRows(ids, [], null, 'd', { shift: true })).toEqual({
      selected: ['d'],
      anchor: 'd',
    })
    expect(selectLogRows(['c', 'd'], [], 'a', 'd', { shift: true })).toEqual({
      selected: ['d'],
      anchor: 'd',
    })
  })
})
