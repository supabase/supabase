import { act, waitFor } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSnippetIdentity } from './useSnippetIdentity'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
} from '@/tests/lib/sql-editor-test-utils'

// `common`'s `useParams` is globally stubbed (see tests/vitestSetup.ts) to a
// constant `{ ref: 'default' }` so most tests don't have to think about
// routing. This suite is specifically about behavior across route changes, so
// it swaps in the real implementation (still backed by the `next-router-mock`
// router the rest of the app is wired to in tests).
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return { ...actual }
})

describe('useSnippetIdentity across route changes', () => {
  beforeEach(() => {
    resetSqlEditorStores()
    mockRouter.setCurrentUrl('/project/default/sql/existing-tab')
  })

  it('generates a fresh id for each new tab, never reusing the previous one', async () => {
    seedSnippet({ id: 'existing-tab', sql: 'select existing;' })

    const { result } = renderSqlEditorHook(useSnippetIdentity)

    await waitFor(() => expect(result.current.id).toEqual('existing-tab'))

    // Click "+" to open a new tab.
    await act(async () => {
      await mockRouter.push('/project/default/sql/new?skip=true')
    })
    const firstNewTabId = result.current.id
    expect(firstNewTabId).not.toEqual('existing-tab')

    // Typing in the new tab creates its snippet and shallow-navigates to it
    // (mirrors the `router.push` inside `useSnippetEditor.handleEditorChange`).
    seedSnippet({ id: firstNewTabId, sql: 'select typed content;' })
    await act(async () => {
      await mockRouter.push(`/project/default/sql/${firstNewTabId}`)
    })
    await waitFor(() => expect(result.current.id).toEqual(firstNewTabId))

    // Click "+" again to open a second new tab.
    await act(async () => {
      await mockRouter.push('/project/default/sql/new?skip=true')
    })
    const secondNewTabId = result.current.id

    expect(secondNewTabId).not.toEqual(firstNewTabId)
    expect(secondNewTabId).not.toEqual('existing-tab')
  })
})
