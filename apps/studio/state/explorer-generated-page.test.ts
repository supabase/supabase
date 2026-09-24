import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  addExplorerGeneratedPage,
  explorerGeneratedPageState,
  getExplorerGeneratedPage,
  removeExplorerGeneratedPage,
} from './explorer-generated-page'
import type { ApprovedGeneratedPageQueries } from '@/components/interfaces/Explorer/GeneratedPage/generated-page.utils'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'

const page: RenderPageInput = {
  title: 'Auth console',
  html: '<h1>Auth</h1>',
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 25 },
  ],
  log_queries: [],
  enable_supabase_client: false,
}

const approvedQueries: ApprovedGeneratedPageQueries = {
  database: new Map([
    [
      'recent_users',
      {
        title: 'Recent users',
        sql: acceptUntrustedSql(untrustedSql('select id from auth.users')),
        rowLimit: 25,
      },
    ],
  ]),
  logs: new Map(),
}

beforeEach(() => {
  for (const id of Object.keys(explorerGeneratedPageState.pages)) {
    removeExplorerGeneratedPage(id)
  }
})

describe('explorerGeneratedPageState', () => {
  it('returns a stored page for its own project', () => {
    addExplorerGeneratedPage({ id: 'p1', projectRef: 'abc', page, approvedQueries })

    const entry = getExplorerGeneratedPage({ id: 'p1', projectRef: 'abc' })
    expect(entry?.page.title).toBe('Auth console')
    expect(entry?.approvedQueries.database.get('recent_users')?.rowLimit).toBe(25)
  })

  it('does not hand a page to a different project', () => {
    addExplorerGeneratedPage({ id: 'p1', projectRef: 'abc', page, approvedQueries })

    expect(getExplorerGeneratedPage({ id: 'p1', projectRef: 'xyz' })).toBeUndefined()
  })

  it('returns nothing for an unknown or missing id', () => {
    expect(getExplorerGeneratedPage({ id: 'nope', projectRef: 'abc' })).toBeUndefined()
    expect(getExplorerGeneratedPage({ id: undefined, projectRef: 'abc' })).toBeUndefined()
    expect(getExplorerGeneratedPage({ id: 'p1', projectRef: undefined })).toBeUndefined()
  })

  it('drops the definition and its approval on remove', () => {
    addExplorerGeneratedPage({ id: 'p1', projectRef: 'abc', page, approvedQueries })
    removeExplorerGeneratedPage('p1')

    expect(getExplorerGeneratedPage({ id: 'p1', projectRef: 'abc' })).toBeUndefined()
    expect(explorerGeneratedPageState.pages).toEqual({})
  })

  it('keeps the approved fragments unproxied so their brands survive the hand-off', () => {
    addExplorerGeneratedPage({ id: 'p1', projectRef: 'abc', page, approvedQueries })

    const entry = getExplorerGeneratedPage({ id: 'p1', projectRef: 'abc' })
    expect(entry?.approvedQueries).toBe(approvedQueries)
    expect(entry?.page).toBe(page)
  })
})
