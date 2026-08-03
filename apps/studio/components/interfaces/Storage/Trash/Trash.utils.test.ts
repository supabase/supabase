import { describe, expect, it } from 'vitest'

import { toggleSelectAll, toggleSelection } from './Trash.utils'

const orderedIds = ['a', 'b', 'c', 'd']

describe('toggleSelection', () => {
  it('adds an unselected row', () => {
    expect(
      toggleSelection({
        selectedIds: [],
        orderedIds,
        id: 'b',
        lastToggledId: null,
        isShiftHeld: false,
      })
    ).toEqual(['b'])
  })

  it('removes an already-selected row', () => {
    expect(
      toggleSelection({
        selectedIds: ['a', 'b'],
        orderedIds,
        id: 'b',
        lastToggledId: null,
        isShiftHeld: false,
      })
    ).toEqual(['a'])
  })

  it('selects the range forwards on shift-click', () => {
    expect(
      toggleSelection({
        selectedIds: ['a'],
        orderedIds,
        id: 'c',
        lastToggledId: 'a',
        isShiftHeld: true,
      })
    ).toEqual(['a', 'b', 'c'])
  })

  it('selects the range backwards on shift-click', () => {
    expect(
      toggleSelection({
        selectedIds: ['d'],
        orderedIds,
        id: 'b',
        lastToggledId: 'd',
        isShiftHeld: true,
      }).sort()
    ).toEqual(['b', 'c', 'd'])
  })

  it('does not duplicate rows already in the range', () => {
    const result = toggleSelection({
      selectedIds: ['a', 'b'],
      orderedIds,
      id: 'c',
      lastToggledId: 'a',
      isShiftHeld: true,
    })
    expect(result).toEqual([...new Set(result)])
  })

  it('falls back to a plain toggle when there is no anchor', () => {
    expect(
      toggleSelection({
        selectedIds: [],
        orderedIds,
        id: 'c',
        lastToggledId: null,
        isShiftHeld: true,
      })
    ).toEqual(['c'])
  })
})

describe('toggleSelectAll', () => {
  it('selects everything when nothing is selected', () => {
    expect(toggleSelectAll([], orderedIds)).toEqual(orderedIds)
  })

  it('selects everything when only some rows are selected', () => {
    expect(toggleSelectAll(['b'], orderedIds)).toEqual(orderedIds)
  })

  it('clears the selection when everything is already selected', () => {
    expect(toggleSelectAll([...orderedIds], orderedIds)).toEqual([])
  })

  it('stays empty for an empty list', () => {
    expect(toggleSelectAll([], [])).toEqual([])
  })
})
