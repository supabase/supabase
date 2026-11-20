import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useSnippetIdentity } from './useSnippetIdentity'
import {
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
} from '@/tests/lib/sql-editor-test-utils'

/**
 * `useParams` is globally stubbed to `{ ref: 'default' }` (no snippet id), so
 * these tests exercise the generated-id branch. The pure id/loading derivation
 * itself is proven exhaustively against `deriveSnippetIdentity` in
 * `SQLEditor.utils.test`; here we assert the hook wires the store in.
 */
describe('useSnippetIdentity', () => {
  beforeEach(() => {
    resetSqlEditorStores()
  })

  it('generates a fresh snippet id + name when there is no URL id', () => {
    const { result } = renderSqlEditorHook(useSnippetIdentity)

    expect(result.current.urlId).toBeUndefined()
    expect(result.current.id).toEqual(expect.any(String))
    expect(result.current.id.length).toBeGreaterThan(0)
    expect(result.current.generatedNewSnippetName).toEqual(expect.any(String))
    expect(result.current.generatedNewSnippetName.length).toBeGreaterThan(0)
  })

  it('reports loading until the snippet content is present in the store', async () => {
    const { result } = renderSqlEditorHook(useSnippetIdentity)

    // The generated snippet has no content in the store yet.
    expect(result.current.isLoading).toBe(true)

    seedSnippet({ id: result.current.id, name: 'My query', sql: 'select 1;' })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})
