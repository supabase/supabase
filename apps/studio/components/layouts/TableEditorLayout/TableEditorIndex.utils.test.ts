import { describe, expect, test } from 'vitest'

import { shouldOpenLastTableOnEditorIndex } from './TableEditorIndex.utils'

describe('shouldOpenLastTableOnEditorIndex', () => {
  test('opens the last table on a fresh visit with no schema param', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: false,
        hasLastTable: true,
        lastTableSchema: 'auth',
      })
    ).toBe(true)
  })

  test('opens the last table when it belongs to the explicit schema', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: false,
        hasLastTable: true,
        explicitSchema: 'auth',
        lastTableSchema: 'auth',
      })
    ).toBe(true)
  })

  test('stays on the list when the explicit schema is a different schema', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: false,
        hasLastTable: true,
        explicitSchema: 'public',
        lastTableSchema: 'auth',
      })
    ).toBe(false)
  })

  test('stays on the list when the explicit schema cannot be matched to a table schema', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: false,
        hasLastTable: true,
        explicitSchema: 'public',
      })
    ).toBe(false)
  })

  test('stays on the list after Back or Forward even when the schema matches', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: true,
        hasLastTable: true,
        explicitSchema: 'public',
        lastTableSchema: 'public',
      })
    ).toBe(false)
  })

  test('stays on the list after Back or Forward when there is no schema param', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: true,
        hasLastTable: true,
        lastTableSchema: 'auth',
      })
    ).toBe(false)
  })

  test('stays on the list when there is no table to open', () => {
    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: false,
        hasLastTable: false,
      })
    ).toBe(false)

    expect(
      shouldOpenLastTableOnEditorIndex({
        isHistoryTraverse: true,
        hasLastTable: false,
        explicitSchema: 'public',
      })
    ).toBe(false)
  })
})
