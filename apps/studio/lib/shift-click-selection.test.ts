import { describe, expect, test } from 'vitest'

import { getShiftClickRowSelection, getShiftClickSelection } from './shift-click-selection'

describe('getShiftClickSelection', () => {
  const orderedKeys = ['a', 'b', 'c', 'd', 'e']

  test('selects the range downward from the anchor', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['b']),
      anchorKey: 'b',
      targetKey: 'd',
    })
    expect([...result].sort()).toEqual(['b', 'c', 'd'])
  })

  test('selects the range upward from the anchor', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['d']),
      anchorKey: 'd',
      targetKey: 'b',
    })
    expect([...result].sort()).toEqual(['b', 'c', 'd'])
  })

  test('deselects the range when the target is already selected', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['a', 'b', 'c', 'd']),
      anchorKey: 'a',
      targetKey: 'd',
    })
    // The anchor row itself is never modified, so 'a' stays selected
    expect([...result].sort()).toEqual(['a'])
  })

  test('leaves the anchor row untouched when it is not selected', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(),
      anchorKey: 'b',
      targetKey: 'd',
    })
    expect([...result].sort()).toEqual(['c', 'd'])
  })

  test('applies the target state to the whole range when it is partially selected', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['c']),
      anchorKey: 'a',
      targetKey: 'd',
    })
    expect([...result].sort()).toEqual(['b', 'c', 'd'])
  })

  test('toggles just the target when it is also the anchor', () => {
    const added = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(),
      anchorKey: 'c',
      targetKey: 'c',
    })
    expect([...added]).toEqual(['c'])

    const removed = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['c']),
      anchorKey: 'c',
      targetKey: 'c',
    })
    expect([...removed]).toEqual([])
  })

  test('falls back to adding the target when there is no anchor', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['a']),
      anchorKey: null,
      targetKey: 'c',
    })
    expect([...result].sort()).toEqual(['a', 'c'])
  })

  test('falls back to removing the target when there is no anchor and it is selected', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['a', 'c']),
      anchorKey: null,
      targetKey: 'c',
    })
    expect([...result].sort()).toEqual(['a'])
  })

  test('falls back to a plain toggle when the anchor is no longer in the rows', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(),
      anchorKey: 'gone',
      targetKey: 'd',
    })
    expect([...result]).toEqual(['d'])
  })

  test('falls back to a plain toggle when the target is not in the rows', () => {
    const result = getShiftClickSelection({
      orderedKeys,
      selectedKeys: new Set(['a']),
      anchorKey: 'a',
      targetKey: 'gone',
    })
    expect([...result].sort()).toEqual(['a', 'gone'])
  })

  test('does not mutate its inputs', () => {
    const selectedKeys = new Set(['b'])
    const keys = [...orderedKeys]
    const result = getShiftClickSelection({
      orderedKeys: keys,
      selectedKeys,
      anchorKey: 'b',
      targetKey: 'd',
    })
    expect(result).not.toBe(selectedKeys)
    expect([...selectedKeys]).toEqual(['b'])
    expect(keys).toEqual(orderedKeys)
  })
})

describe('getShiftClickRowSelection', () => {
  const orderedRowIds = ['a', 'b', 'c', 'd', 'e']

  test('selects the range between the anchor and the target', () => {
    const result = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection: { b: true },
      anchorRowId: 'b',
      targetRowId: 'd',
    })
    expect(result).toEqual({ b: true, c: true, d: true })
  })

  test('deselects the range when the target is already selected', () => {
    const result = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection: { a: true, b: true, c: true, d: true },
      anchorRowId: 'a',
      targetRowId: 'd',
    })
    expect(result).toEqual({ a: true })
  })

  test('falls back to a plain toggle when there is no anchor', () => {
    const added = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection: { a: true },
      anchorRowId: null,
      targetRowId: 'c',
    })
    expect(added).toEqual({ a: true, c: true })

    const removed = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection: { a: true, c: true },
      anchorRowId: null,
      targetRowId: 'c',
    })
    expect(removed).toEqual({ a: true })
  })

  test('ignores ids explicitly set to false and never returns false entries', () => {
    const result = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection: { a: false, b: true, c: false },
      anchorRowId: 'b',
      targetRowId: 'd',
    })
    expect(result).toEqual({ b: true, c: true, d: true })
    expect(Object.values(result).every((isSelected) => isSelected === true)).toBe(true)
  })

  test('does not mutate the row selection it is given', () => {
    const rowSelection = { b: true }
    const result = getShiftClickRowSelection({
      orderedRowIds,
      rowSelection,
      anchorRowId: 'b',
      targetRowId: 'd',
    })
    expect(result).not.toBe(rowSelection)
    expect(rowSelection).toEqual({ b: true })
  })
})
