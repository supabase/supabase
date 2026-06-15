import { describe, expect, it } from 'vitest'

import { getTabDisplayLabel, hasUnsavedSqlTabChanges } from './Tabs.utils'
import type { Tab } from '@/state/tabs'

const sqlTab = (overrides: Partial<Tab> = {}): Tab => ({
  id: 'sql-1',
  type: 'sql',
  label: 'Untitled query',
  metadata: { sqlId: '1', name: 'Untitled query' },
  ...overrides,
})

describe('SQL tab display labels', () => {
  it('marks draft SQL tabs as unsaved', () => {
    const tab = sqlTab({ metadata: { sqlId: '1', isDraft: true } })

    expect(
      getTabDisplayLabel({
        tab,
        autoSaveSnippets: true,
      })
    ).toBe('Untitled query*')
  })

  it('marks snippets that have not been saved to the backend yet', () => {
    const tab = sqlTab()

    expect(
      getTabDisplayLabel({
        tab,
        snippet: { snippet: { isNotSavedInDatabaseYet: true } },
        autoSaveSnippets: true,
      })
    ).toBe('Untitled query*')
  })

  it('marks dirty saved SQL tabs when autosave is disabled', () => {
    const tab = sqlTab()

    expect(
      hasUnsavedSqlTabChanges({
        tab,
        snippet: { snippet: { content: { unchecked_sql: 'select 2' } } },
        savedSql: 'select 1',
        autoSaveSnippets: false,
      })
    ).toBe(true)

    expect(
      getTabDisplayLabel({
        tab,
        snippet: { snippet: { content: { unchecked_sql: 'select 2' } } },
        savedSql: 'select 1',
        autoSaveSnippets: false,
      })
    ).toBe('Untitled query*')
  })

  it('does not mark dirty saved SQL tabs when autosave is enabled', () => {
    const tab = sqlTab()

    expect(
      getTabDisplayLabel({
        tab,
        snippet: { snippet: { content: { unchecked_sql: 'select 2' } } },
        savedSql: 'select 1',
        autoSaveSnippets: true,
      })
    ).toBe('Untitled query')
  })

  it('does not mark clean saved SQL tabs', () => {
    const tab = sqlTab()

    expect(
      getTabDisplayLabel({
        tab,
        snippet: { snippet: { content: { unchecked_sql: 'select 1' } } },
        savedSql: 'select 1',
        autoSaveSnippets: false,
      })
    ).toBe('Untitled query')
  })
})
