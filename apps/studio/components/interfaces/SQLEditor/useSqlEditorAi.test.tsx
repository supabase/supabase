import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import type { SqlSnippetSource } from './querySource'
import { DiffType } from './SQLEditor.types'
import { useSqlEditorAi } from './useSqlEditorAi'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { API_URL } from '@/lib/constants'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { sqlEditorDiffRequestState } from '@/state/sql-editor/sql-editor-diff-request'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import { mswServer } from '@/tests/lib/msw'
import {
  createInMemoryEditor,
  renderSqlEditorHook,
  resetSqlEditorStores,
  seedSnippet,
  setupSqlEditorMocks,
} from '@/tests/lib/sql-editor-test-utils'

const SNIPPET_ID = 'ai-snippet'

type HarnessProps = { editorMountCount?: number; sqlSource?: SqlSnippetSource }

/**
 * Composes the diff + prompt state hooks the AI hook depends on (production
 * wires these together in `SQLEditorControllers`), so tests drive the real
 * accept/discard/drain flows end to end.
 */
function useAiHarness({ editorMountCount = 1, sqlSource = 'database' }: HarnessProps = {}) {
  const diff = useSqlEditorDiff()
  const prompt = useSqlEditorPrompt()
  const ai = useSqlEditorAi({ id: SNIPPET_ID, editorMountCount, diff, prompt, sqlSource })
  return { ai, diff, prompt }
}

beforeEach(() => {
  resetSqlEditorStores()
  setupSqlEditorMocks()
})

afterEach(() => {
  resetSqlEditorStores()
})

describe('useSqlEditorAi — diff-request drain', () => {
  it('copies the requested SQL straight into an empty editor and consumes the request', async () => {
    sqlEditorDiffRequestState.requestDiff('select 100;', DiffType.Modification)
    const inMemoryEditor = createInMemoryEditor('')

    const { result } = renderSqlEditorHook(useAiHarness, { inMemoryEditor })

    await waitFor(() => expect(inMemoryEditor.editor.getValue()).toBe('select 100;'))
    // One-shot: the request is drained so it can't re-apply to a later editor.
    expect(sqlEditorDiffRequestState.pending).toBeUndefined()
    expect(result.current.diff.isDiffOpen).toBe(false)
  })

  it('opens a diff between existing and requested SQL when the editor is non-empty', async () => {
    sqlEditorDiffRequestState.requestDiff('select 42;', DiffType.Modification)
    const inMemoryEditor = createInMemoryEditor('select 1;')

    const { result } = renderSqlEditorHook(useAiHarness, { inMemoryEditor })

    await waitFor(() => expect(result.current.diff.isDiffOpen).toBe(true))
    // The diff-sync effect pushes the resolved diff into the (in-memory) diff editor.
    expect(inMemoryEditor.getDiffOriginal()).toBe('select 1;')
    expect(inMemoryEditor.getDiffModified()).toBe('select 42;')
    expect(sqlEditorDiffRequestState.pending).toBeUndefined()
    // The editor's own contents are untouched until the diff is accepted.
    expect(inMemoryEditor.editor.getValue()).toBe('select 1;')
  })

  it('drains a pending request exactly once across editor remounts', async () => {
    sqlEditorDiffRequestState.requestDiff('select 100;', DiffType.Modification)
    const inMemoryEditor = createInMemoryEditor('')

    const { rerender } = renderSqlEditorHook(useAiHarness, {
      inMemoryEditor,
      initialProps: { editorMountCount: 1 },
    })

    await waitFor(() => expect(inMemoryEditor.editor.getValue()).toBe('select 100;'))

    // Simulate a fresh editor mount: the consumed request must not re-apply.
    inMemoryEditor.setValue('edited by user')
    rerender({ editorMountCount: 2 })

    await new Promise((r) => setTimeout(r, 20))
    expect(inMemoryEditor.editor.getValue()).toBe('edited by user')
  })
})

describe('useSqlEditorAi — accept / discard diff', () => {
  async function openModificationDiff() {
    sqlEditorDiffRequestState.requestDiff('select 42;', DiffType.Modification)
    const inMemoryEditor = createInMemoryEditor('select 1;')
    const utils = renderSqlEditorHook(useAiHarness, { inMemoryEditor })
    await waitFor(() => expect(utils.result.current.diff.isDiffOpen).toBe(true))
    return { ...utils, inMemoryEditor }
  }

  it('accepting a modification writes the diff result back into the editor and closes the diff', async () => {
    const { result, inMemoryEditor } = await openModificationDiff()

    await act(async () => {
      await result.current.ai.acceptAiHandler()
    })

    await waitFor(() => expect(result.current.diff.isDiffOpen).toBe(false))
    expect(inMemoryEditor.editor.getValue()).toBe('select 42;')
  })

  it('discarding a diff leaves the editor untouched and closes the diff', async () => {
    const { result, inMemoryEditor } = await openModificationDiff()

    await act(async () => {
      result.current.ai.discardAiHandler()
    })

    await waitFor(() => expect(result.current.diff.isDiffOpen).toBe(false))
    expect(inMemoryEditor.editor.getValue()).toBe('select 1;')
  })
})

describe('useSqlEditorAi — completion dialect', () => {
  type CompletionRequestBody = {
    dialect?: string
    intent?: string
    completionMetadata: {
      prompt: string
      selection: string
      textBeforeCursor: string
      textAfterCursor: string
      availableKeys?: string[]
    }
  }

  /** Replaces the default completion mock so we can read what was posted. */
  function captureCompletionRequests(response: string) {
    const bodies: CompletionRequestBody[] = []
    mswServer.use(
      http.post(`${API_URL}/ai/code/complete`, async ({ request }) => {
        bodies.push((await request.json()) as CompletionRequestBody)
        return HttpResponse.json(response)
      })
    )
    return bodies
  }

  const context = {
    beforeSelection: "select timestamp from logs where source = 'edge_logs'\n",
    selection: 'limit 5',
    afterSelection: '',
  }

  it('posts the clickhouse dialect with the raw instruction and cursor context', async () => {
    const bodies = captureCompletionRequests('limit 10')
    const { result } = renderSqlEditorHook(useAiHarness, {
      initialProps: { sqlSource: 'logs' },
    })

    await act(async () => {
      await result.current.ai.handlePrompt('only keep 5xx responses', context)
    })

    expect(bodies).toHaveLength(1)
    expect(bodies[0].dialect).toBe('clickhouse')
    // The route assembles the schema section and the selection-wrapped code around
    // the instruction, so the client posts the instruction verbatim — the same
    // shape as the Postgres path — and never hand-builds prompt text.
    expect(bodies[0].completionMetadata.prompt).toBe('only keep 5xx responses')
    expect(bodies[0].completionMetadata.selection).toBe('limit 5')
    expect(bodies[0].completionMetadata.textBeforeCursor).toBe(context.beforeSelection)
    // An inline edit is not a rewrite.
    expect(bodies[0].intent).toBeUndefined()
  })

  it('posts the postgres dialect with the raw instruction for a database snippet', async () => {
    const bodies = captureCompletionRequests('limit 10')
    const { result } = renderSqlEditorHook(useAiHarness, {
      initialProps: { sqlSource: 'database' },
    })

    await act(async () => {
      await result.current.ai.handlePrompt('bump the limit', context)
    })

    expect(bodies).toHaveLength(1)
    expect(bodies[0].dialect).toBe('postgres')
    expect(bodies[0].completionMetadata.prompt).toBe('bump the limit')
  })

  it('strips code fences and leaves clickhouse output unformatted', async () => {
    captureCompletionRequests('```sql\nlimit 10\n```')
    const { result } = renderSqlEditorHook(useAiHarness, {
      initialProps: { sqlSource: 'logs' },
    })

    await act(async () => {
      await result.current.ai.handlePrompt('bump the limit', context)
    })

    await waitFor(() => expect(result.current.diff.isDiffOpen).toBe(true))
    // sql-formatter is Postgres-only, so the ClickHouse diff is the reassembled
    // query verbatim — fences stripped, nothing else touched.
    expect(result.current.diff.sourceSqlDiff).toEqual({
      original: `${context.beforeSelection}limit 5`,
      modified: `${context.beforeSelection}limit 10`,
    })
  })

  it('still formats database output through sql-formatter', async () => {
    captureCompletionRequests('limit 10')
    const { result } = renderSqlEditorHook(useAiHarness, {
      initialProps: { sqlSource: 'database' },
    })

    await act(async () => {
      await result.current.ai.handlePrompt('bump the limit', context)
    })

    await waitFor(() => expect(result.current.diff.isDiffOpen).toBe(true))
    expect(result.current.diff.sourceSqlDiff?.modified).not.toBe(
      `${context.beforeSelection}limit 10`
    )
  })
})

describe('useSqlEditorAi — debug', () => {
  it('onDebug opens the assistant sidebar and starts a debug chat from the failing snippet', async () => {
    seedSnippet({ id: SNIPPET_ID, name: 'Broken query', sql: 'selct 1;' })
    sqlEditorSessionState.addResultError(SNIPPET_ID, { message: 'syntax error at or near "selct"' })

    const { result, aiAssistantState } = renderSqlEditorHook(useAiHarness)

    await act(async () => {
      await result.current.ai.onDebug()
    })

    // No sidebar is registered in the test tree, so opening queues a pending open.
    expect(sidebarManagerState.pendingSidebarOpen).toBe(SIDEBAR_KEYS.AI_ASSISTANT)

    const activeChat = aiAssistantState.chats[aiAssistantState.activeChatId ?? '']
    expect(activeChat?.name).toBe('Debug SQL snippet')
    // Attached with its source, which is what carries sqlSource onto the message the
    // user submits from the prefilled composer.
    expect(aiAssistantState.sqlSnippets).toEqual([
      { label: 'Current Query', content: 'selct 1;', source: 'database' },
    ])
    expect(aiAssistantState.initialInput).toContain('syntax error at or near "selct"')
  })

  it('buildDebugPrompt embeds the snippet SQL and its error message', async () => {
    seedSnippet({ id: SNIPPET_ID, name: 'Broken query', sql: 'selct 1;' })
    sqlEditorSessionState.addResultError(SNIPPET_ID, { message: 'boom' })

    const { result } = renderSqlEditorHook(useAiHarness)

    const promptText = result.current.ai.buildDebugPrompt()
    expect(promptText).toContain('boom')
    expect(promptText).toContain('selct 1;')
  })
})
