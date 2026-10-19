import { describe, expect, test } from 'vitest'

import {
  readExplicitSchemaQueryParam,
  shouldOpenLastTableOnEditorIndex,
} from './TableEditorIndex.utils'

describe('readExplicitSchemaQueryParam', () => {
  test('returns a schema query value', () => {
    expect(readExplicitSchemaQueryParam('public')).toBe('public')
  })

  test('returns the first value when the query repeats the key', () => {
    expect(readExplicitSchemaQueryParam(['auth', 'public'])).toBe('auth')
  })

  test('treats a missing or empty value as no explicit schema', () => {
    expect(readExplicitSchemaQueryParam(undefined)).toBeUndefined()
    expect(readExplicitSchemaQueryParam('')).toBeUndefined()
    expect(readExplicitSchemaQueryParam([])).toBeUndefined()
  })
})

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
