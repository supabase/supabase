import { act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { usePrettifyQuery } from './usePrettifyQuery'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import {
  createInMemoryEditor,
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const SNIPPET_ID = 'prettify-snippet'
const MESSY_SQL = 'select    id,name   from    users'

function usePrettifyHarness({ isDiffOpen }: { isDiffOpen: boolean }) {
  const { data: project } = useSelectedProjectQuery()
  const prettifyQuery = usePrettifyQuery({ id: SNIPPET_ID, isDiffOpen })
  return { prettifyQuery, isReady: !!project }
}

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks()
  seedSnippet({ id: SNIPPET_ID, name: 'My query', sql: MESSY_SQL })
})

afterEach(() => {
  resetSqlEditorStores()
})

describe('usePrettifyQuery', () => {
  it('formats the editor SQL in place and writes it back to the snippet store', async () => {
    const inMemoryEditor = createInMemoryEditor(MESSY_SQL)
    const { result } = renderSqlEditorHook(
      (props: { isDiffOpen: boolean }) => usePrettifyHarness(props),
      { inMemoryEditor, initialProps: { isDiffOpen: false } }
    )
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.prettifyQuery()
    })

    const expected = formatSql(MESSY_SQL)
    expect(inMemoryEditor.editor.getValue()).toBe(expected)
    expect(sqlEditorState.snippets[SNIPPET_ID].snippet.content?.unchecked_sql).toBe(expected)
  })

  it('is a no-op while a diff is open', async () => {
    const inMemoryEditor = createInMemoryEditor(MESSY_SQL)
    const { result } = renderSqlEditorHook(
      (props: { isDiffOpen: boolean }) => usePrettifyHarness(props),
      { inMemoryEditor, initialProps: { isDiffOpen: true } }
    )
    await waitFor(() => expect(result.current.isReady).toBe(true))

    await act(async () => {
      await result.current.prettifyQuery()
    })

    expect(inMemoryEditor.editor.getValue()).toBe(MESSY_SQL)
  })
})
