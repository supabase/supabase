import { describe, expect, it } from 'vitest'

import {
  getSelfHostedSnippetStoreAction,
  getSelfHostedSnippetStoreSyncPlan,
} from './self-hosted-snippet-store.utils'

describe('getSelfHostedSnippetStoreAction', () => {
  it('returns replace when the snippet id changes (rename name or move folder)', () => {
    expect(getSelfHostedSnippetStoreAction('old-id', 'new-id')).toBe('replace')
  })

  it('returns update when the snippet id is unchanged (e.g. description-only rename)', () => {
    expect(getSelfHostedSnippetStoreAction('same-id', 'same-id')).toBe('update')
  })
})

describe('getSelfHostedSnippetStoreSyncPlan', () => {
  it('replace + viewing + open tab: navigate and remove old tab, never update-in-place', () => {
    expect(
      getSelfHostedSnippetStoreSyncPlan({
        previousId: 'old-id',
        nextSnippetId: 'new-id',
        isViewingSnippet: true,
        hasOldTab: true,
      })
    ).toEqual({
      action: 'replace',
      previousId: 'old-id',
      nextSnippetId: 'new-id',
      shouldNavigate: true,
      shouldRemoveOldTab: true,
    })
  })

  it('replace + not viewing: skip navigation and tab removal', () => {
    expect(
      getSelfHostedSnippetStoreSyncPlan({
        previousId: 'old-id',
        nextSnippetId: 'new-id',
        isViewingSnippet: false,
        hasOldTab: false,
      })
    ).toEqual({
      action: 'replace',
      previousId: 'old-id',
      nextSnippetId: 'new-id',
      shouldNavigate: false,
      shouldRemoveOldTab: false,
    })
  })

  it('same id (description-only rename): update in place, no navigation or tab teardown', () => {
    expect(
      getSelfHostedSnippetStoreSyncPlan({
        previousId: 'same-id',
        nextSnippetId: 'same-id',
        isViewingSnippet: true,
        hasOldTab: true,
      })
    ).toEqual({
      action: 'update',
      snippetId: 'same-id',
    })
  })
})
