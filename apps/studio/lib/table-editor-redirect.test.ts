import { describe, expect, test } from 'vitest'

import { getLastTableRedirect } from './table-editor-redirect'

const tableTab = (tableId: number, schema: string) => ({
  type: 'r',
  metadata: { tableId, schema },
})

describe('getLastTableRedirect', () => {
  test('stays on the list when an explicit schema is not the last table schema', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: ['r-12'],
        tabsMap: { 'r-12': tableTab(12, 'auth') },
        explicitSchema: 'public',
      })
    ).toBeNull()
  })

  test('uses the history table schema when the url has no schema', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: ['r-12'],
        tabsMap: { 'r-12': tableTab(12, 'auth') },
      })
    ).toEqual({ tableId: 12, schema: 'auth' })
  })

  test('opens the history table when the explicit schema matches', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: ['r-12'],
        tabsMap: { 'r-12': tableTab(12, 'auth') },
        explicitSchema: 'auth',
      })
    ).toEqual({ tableId: 12, schema: 'auth' })
  })

  test('falls back to the first open table tab when history is empty', () => {
    expect(
      getLastTableRedirect({
        openTabs: ['sql-1', 'r-34'],
        tabsMap: {
          'sql-1': { type: 'sql' },
          'r-34': tableTab(34, 'public'),
        },
      })
    ).toEqual({ tableId: 34, schema: 'public' })
  })

  test('ignores a non-numeric history editor and uses the open table tab', () => {
    expect(
      getLastTableRedirect({
        historyEditor: 'latest',
        openTabs: ['sql-1', 'r-34'],
        tabsMap: {
          'sql-1': { type: 'sql' },
          'r-34': tableTab(34, 'public'),
        },
      })
    ).toEqual({ tableId: 34, schema: 'public' })
  })

  test('uses a history id when that table has no open tab', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: [],
        tabsMap: {},
      })
    ).toEqual({ tableId: 12, schema: undefined })
  })

  test('uses the open table tab when history is not an id and the explicit schema matches', () => {
    expect(
      getLastTableRedirect({
        historyEditor: 'latest',
        openTabs: ['sql-1', 'r-34'],
        tabsMap: {
          'sql-1': { type: 'sql' },
          'r-34': tableTab(34, 'public'),
        },
        explicitSchema: 'public',
      })
    ).toEqual({ tableId: 34, schema: 'public' })
  })

  test('returns null when an explicit schema has no known table schema', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: [],
        tabsMap: {},
        explicitSchema: 'public',
      })
    ).toBeNull()
  })

  test('returns null when nothing points at a table', () => {
    expect(
      getLastTableRedirect({
        openTabs: ['sql-1'],
        tabsMap: { 'sql-1': { type: 'sql' } },
      })
    ).toBeNull()
  })

  test('returns null for an explicit schema when there is no last table', () => {
    expect(
      getLastTableRedirect({
        openTabs: [],
        tabsMap: {},
        explicitSchema: 'public',
      })
    ).toBeNull()
  })
})
