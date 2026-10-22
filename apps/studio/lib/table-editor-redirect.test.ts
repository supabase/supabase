import { describe, expect, test } from 'vitest'

import { getLastTableRedirect } from './table-editor-redirect'

const tableTab = (tableId: number, schema: string) => ({
  type: 'r',
  metadata: { tableId, schema },
})

describe('getLastTableRedirect', () => {
  test('uses an explicit schema with the history table', () => {
    expect(
      getLastTableRedirect({
        historyEditor: '12',
        openTabs: ['r-12'],
        tabsMap: { 'r-12': tableTab(12, 'auth') },
        explicitSchema: 'public',
      })
    ).toEqual({ tableId: 12, schema: 'public' })
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
