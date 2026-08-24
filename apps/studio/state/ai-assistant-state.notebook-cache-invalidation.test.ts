import type { UIMessageChunk } from 'ai'
import { convertArrayToReadableStream } from 'ai/test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { contentKeys } from '@/data/content/keys'
import { getQueryClient } from '@/data/query-client'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook } from '@/state/notebooks/types'

const testContext = vi.hoisted(() => ({
  queuedStreams: [] as Array<Array<UIMessageChunk>>,
}))

// Swaps only the network transport for a scripted one — the real `Chat` class, its stream
// reducer, and `sendAutomaticallyWhen` all run for real, so this exercises the actual
// `onFinish` wired up in `createChatInstance`, not a hand-rolled call to its helpers.
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    DefaultChatTransport: class {
      async sendMessages() {
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
    // Removed, not just invalidated — see notebook-cache.ts for why.
    expect(queryClient.getQueryData(contentKeys.resource(PROJECT_REF, NOTEBOOK_ID))).toBeUndefined()
  })
})
