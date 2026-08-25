import { QueryClient } from '@tanstack/react-query'
import type { ToolUIPart, UIMessage } from 'ai'
import { afterEach, describe, expect, it } from 'vitest'

import {
  applyNotebookCacheEffects,
  collectNotebookCacheEffects,
} from './notebook-cache-invalidation'
import {
  createAssistantMessageWithCreateNotebookTool,
  createAssistantMessageWithDeleteNotebookTool,
  createAssistantMessageWithUpdateNotebookTool,
  createAssistantTextMessage,
  createUserMessage,
} from './test-fixtures'
import { contentKeys } from '@/data/content/keys'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'

const PROJECT_REF = 'default'

function toolPart(overrides: Partial<ToolUIPart>): ToolUIPart {
  return {
    type: 'tool-update_notebook',
    toolCallId: 'call-1',
    state: 'output-available',
    input: {},
    output: { id: 'notebook-1', name: 'Signup funnel' },
    ...overrides,
  } as ToolUIPart
}

function assistantMessage(parts: UIMessage['parts'], id = 'assistant-1'): UIMessage {
  return { id, role: 'assistant', parts }
}

describe('collectNotebookCacheEffects', () => {
  it('collects a create_notebook output-available part', () => {
    const messages = [createAssistantMessageWithCreateNotebookTool()]

    const effects = collectNotebookCacheEffects(messages, new Set())

    expect(effects).toEqual([{ _tag: 'upserted', toolCallId: 'call-notebook-1', id: 'notebook-1' }])
  })

  it('collects an update_notebook output-available part', () => {
    const messages = [createAssistantMessageWithUpdateNotebookTool()]

    const effects = collectNotebookCacheEffects(messages, new Set())

    expect(effects).toEqual([{ _tag: 'upserted', toolCallId: 'call-notebook-1', id: 'notebook-1' }])
  })

  it('collects a delete_notebook output-available part', () => {
    const messages = [createAssistantMessageWithDeleteNotebookTool()]

    const effects = collectNotebookCacheEffects(messages, new Set())

    expect(effects).toEqual([{ _tag: 'deleted', toolCallId: 'call-notebook-1', id: 'notebook-1' }])
  })

  it('ignores non-terminal tool states', () => {
    const messages = [
      assistantMessage([
        toolPart({ type: 'tool-create_notebook', state: 'input-streaming' }),
        toolPart({ type: 'tool-update_notebook', state: 'approval-requested' }),
        toolPart({ type: 'tool-update_notebook', state: 'output-error' }),
      ]),
    ]

    expect(collectNotebookCacheEffects(messages, new Set())).toEqual([])
  })

  it('ignores malformed output', () => {
    const messages = [
      assistantMessage([toolPart({ output: { unexpected: true } })]),
      assistantMessage([toolPart({ toolCallId: 'call-2', output: undefined })]),
    ]

    expect(collectNotebookCacheEffects(messages, new Set())).toEqual([])
  })

  it('ignores unrelated message types and tool parts', () => {
    const messages = [
      createUserMessage('update my notebook'),
      createAssistantTextMessage('Sure, updating it now.'),
    ]

    expect(collectNotebookCacheEffects(messages, new Set())).toEqual([])
  })

  it('collects output on an earlier message even when a later message has already finished', () => {
    const messages = [
      assistantMessage([toolPart({ toolCallId: 'call-earlier' })], 'assistant-1'),
      createAssistantTextMessage('All done!', 'assistant-2'),
    ]

    const effects = collectNotebookCacheEffects(messages, new Set())

    expect(effects).toEqual([{ _tag: 'upserted', toolCallId: 'call-earlier', id: 'notebook-1' }])
  })

  it('dedupes against the processed set', () => {
    const messages = [assistantMessage([toolPart({ toolCallId: 'call-1' })])]

    expect(collectNotebookCacheEffects(messages, new Set(['call-1']))).toEqual([])
  })
})

describe('applyNotebookCacheEffects', () => {
  const NOTEBOOK: Notebook = {
    id: 'notebook-1',
    type: 'notebook',
    name: 'Test notebook',
    visibility: 'project',
    favorite: false,
    owner_id: 1,
    project_id: 1,
    content: { schema_version: 1, cells: [] },
  }

  afterEach(() => {
    delete notebooksState.notebooks[NOTEBOOK.id]
    notebooksState.needsSaving.clear()
  })

  it('invalidates the nav list and evicts an upserted, saved notebook from the cache', async () => {
    notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK.id), { id: NOTEBOOK.id })
    queryClient.setQueryData(contentKeys.allContentLists(PROJECT_REF), [])
    queryClient.setQueryData(contentKeys.infiniteList(PROJECT_REF), {})

    await applyNotebookCacheEffects({
      queryClient,
      projectRef: PROJECT_REF,
      effects: [{ _tag: 'upserted', toolCallId: 'call-1', id: NOTEBOOK.id }],
    })

    expect(queryClient.getQueryState(contentKeys.allContentLists(PROJECT_REF))?.isInvalidated).toBe(
      true
    )
    expect(queryClient.getQueryState(contentKeys.infiniteList(PROJECT_REF))?.isInvalidated).toBe(
      true
    )
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK.id))).toBeUndefined()
    expect(notebooksState.notebooks[NOTEBOOK.id]).toBeUndefined()
  })

  it('invalidates the nav list and evicts a deleted notebook from the cache', async () => {
    notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK.id), { id: NOTEBOOK.id })
    queryClient.setQueryData(contentKeys.allContentLists(PROJECT_REF), [])
    queryClient.setQueryData(contentKeys.infiniteList(PROJECT_REF), {})

    await applyNotebookCacheEffects({
      queryClient,
      projectRef: PROJECT_REF,
      effects: [{ _tag: 'deleted', toolCallId: 'call-1', id: NOTEBOOK.id }],
    })

    expect(queryClient.getQueryState(contentKeys.allContentLists(PROJECT_REF))?.isInvalidated).toBe(
      true
    )
    expect(queryClient.getQueryState(contentKeys.infiniteList(PROJECT_REF))?.isInvalidated).toBe(
      true
    )
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK.id))).toBeUndefined()
    expect(notebooksState.notebooks[NOTEBOOK.id]).toBeUndefined()
  })

  it('leaves a dirty (unsaved) notebook in the store untouched', async () => {
    notebooksState.addNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
    const queryClient = new QueryClient()

    await applyNotebookCacheEffects({
      queryClient,
      projectRef: PROJECT_REF,
      effects: [{ _tag: 'upserted', toolCallId: 'call-1', id: NOTEBOOK.id }],
    })

    expect(notebooksState.notebooks[NOTEBOOK.id]).toBeDefined()
  })

  it('leaves an edited (unsaved, non-empty) notebook untouched', async () => {
    notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook: NOTEBOOK })
    notebooksState.updateCells({
      id: NOTEBOOK.id,
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'local edit' }],
    })
    expect(notebooksState.notebooks[NOTEBOOK.id].status).toBe('unsaved')
    const queryClient = new QueryClient()

    await applyNotebookCacheEffects({
      queryClient,
      projectRef: PROJECT_REF,
      effects: [{ _tag: 'upserted', toolCallId: 'call-1', id: NOTEBOOK.id }],
    })

    expect(notebooksState.notebooks[NOTEBOOK.id]).toBeDefined()
  })

  it('no-ops entirely for an empty effects list', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(contentKeys.allContentLists(PROJECT_REF), [])

    await applyNotebookCacheEffects({ queryClient, projectRef: PROJECT_REF, effects: [] })

    expect(queryClient.getQueryState(contentKeys.allContentLists(PROJECT_REF))?.isInvalidated).toBe(
      false
    )
  })
})
