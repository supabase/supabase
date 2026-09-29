import type { UIMessageChunk } from 'ai'
import { convertArrayToReadableStream } from 'ai/test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { contentKeys } from '@/data/content/keys'
import { getQueryClient } from '@/data/query-client'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'

const testContext = vi.hoisted(() => ({
  queuedStreams: [] as Array<Array<UIMessageChunk>>,
  onSend: undefined as (() => void) | undefined,
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    DefaultChatTransport: class {
      constructor(private options: any = {}) {}
      async sendMessages(opts: any) {
        await this.options.prepareSendMessagesRequest?.({
          api: this.options.api,
          id: opts.chatId,
          messages: opts.messages,
          body: { ...this.options.body, ...opts.body },
          headers: {},
          credentials: undefined,
          requestMetadata: opts.metadata,
          trigger: opts.trigger,
          messageId: opts.messageId,
        })
        testContext.onSend?.()
        const chunks = testContext.queuedStreams.shift()
        if (!chunks) throw new Error('No queued stream for this sendMessages call')
        return convertArrayToReadableStream(chunks)
      }
      async reconnectToStream() {
        return null
      }
    },
  }
})

const { createAiAssistantState } = await import('./ai-assistant-state')

const PROJECT_REF = 'default'
const NOTEBOOK_ID = 'notebook-onfinish-test'

const seedNotebook = () => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  const notebook: Notebook = {
    id: NOTEBOOK_ID,
    type: 'notebook',
    name: 'Test notebook',
    visibility: 'project',
    favorite: false,
    owner_id: 1,
    project_id: 1,
    content: {
      schema_version: 1,
      cells: [{ _tag: 'markdown_cell', _id: 'cell-1', text: 'Original' }],
    },
  }
  notebooksState.setNotebook({ projectRef: PROJECT_REF, notebook })
}

afterEach(() => {
  delete notebooksState.notebooks[NOTEBOOK_ID]
  notebooksState.needsSaving.clear()
  testContext.queuedStreams = []
  testContext.onSend = undefined
})

describe('createChatInstance onFinish — notebook cache invalidation via a real Chat/stream', () => {
  it('evicts the notebook from caches once update_notebook reaches output-available, after an approval round trip', async () => {
    seedNotebook()

    const queryClient = getQueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })

    const state = createAiAssistantState()
    state.setContext({ projectRef: PROJECT_REF })
    const chatId = state.createChat({ name: 'Delete a cell' })
    const chatInstance = state.chatInstances[chatId]

    // First stream: assistant proposes update_notebook, which needs approval.
    testContext.queuedStreams.push([
      { type: 'start' },
      {
        type: 'tool-input-available',
        toolCallId: 'call-1',
        toolName: 'update_notebook',
        input: {
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        },
      },
      { type: 'tool-approval-request', approvalId: 'approval-1', toolCallId: 'call-1' },
      { type: 'finish' },
    ])

    await chatInstance.sendMessage({ text: 'Delete the first cell' })

    // Still pending approval — must not evict yet.
    expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeDefined()

    // Second stream: after approval, the tool actually executes and returns its result.
    testContext.queuedStreams.push([
      { type: 'start' },
      {
        type: 'tool-output-available',
        toolCallId: 'call-1',
        output: { id: NOTEBOOK_ID, name: 'Test notebook' },
      },
      { type: 'finish' },
    ])

    await chatInstance.addToolApprovalResponse({ id: 'approval-1', approved: true })

    await vi.waitFor(() => {
      expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    })
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
  })

  it('binds cache effects to the project the request was sent under, not whatever project is active when the stream finishes', async () => {
    seedNotebook()
    const OTHER_PROJECT_REF = 'other-project'

    const queryClient = getQueryClient()
    queryClient.setQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID), { id: NOTEBOOK_ID })

    const state = createAiAssistantState()
    state.setContext({ projectRef: PROJECT_REF })
    const chatId = state.createChat({ name: 'Delete a cell' })
    const chatInstance = state.chatInstances[chatId]

    testContext.queuedStreams.push([
      { type: 'start' },
      {
        type: 'tool-input-available',
        toolCallId: 'call-1',
        toolName: 'update_notebook',
        input: {
          id: NOTEBOOK_ID,
          expected_updated_at: '2024-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-1' }],
        },
      },
      { type: 'tool-approval-request', approvalId: 'approval-1', toolCallId: 'call-1' },
      { type: 'finish' },
    ])
    await chatInstance.sendMessage({ text: 'Delete the first cell' })

    testContext.queuedStreams.push([
      { type: 'start' },
      {
        type: 'tool-output-available',
        toolCallId: 'call-1',
        output: { id: NOTEBOOK_ID, name: 'Test notebook' },
      },
      { type: 'finish' },
    ])

    // Simulate navigating to a different project while the approval round-trip is in
    // flight: after the request was sent (with the origin project ref in its body), but
    // before its stream resolves and onFinish runs.
    testContext.onSend = () => state.setContext({ projectRef: OTHER_PROJECT_REF })

    await chatInstance.addToolApprovalResponse({ id: 'approval-1', approved: true })

    await vi.waitFor(() => {
      expect(notebooksState.notebooks[NOTEBOOK_ID]).toBeUndefined()
    })
    // Must evict the origin project's cache entry — the one the write actually happened
    // in — not whichever project happened to be active once the stream finished.
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
  })
})
