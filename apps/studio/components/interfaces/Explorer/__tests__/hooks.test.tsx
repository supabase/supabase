import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat, useLoadNotebook } from '../hooks'
import { STUB_NOTEBOOKS } from '@/data/content/notebooks/notebooks-infinite-query'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { Notebook, StateNotebook } from '@/state/notebooks/types'
import { customRenderHook } from '@/tests/lib/custom-render'

// getNotebook simulates network latency via `timeout` — mock it away so these tests are
// fast, and so we can assert on whether it was called at all (a proxy for "was a fetch
// attempted", since the stub never hits the network for vi.spyOn/MSW to observe).
const { mockTimeout } = vi.hoisted(() => ({ mockTimeout: vi.fn(() => Promise.resolve()) }))
vi.mock('@/lib/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/helpers')>()
  return { ...actual, timeout: mockTimeout }
})

const {
  mockCreateChat,
  mockPush,
  mockSelectChat,
  mockSetContext,
  mockSetModel,
  mockWhenInitialized,
} = vi.hoisted(() => ({
  mockCreateChat: vi.fn(() => 'chat-2'),
  mockPush: vi.fn(),
  mockSelectChat: vi.fn(),
  mockSetContext: vi.fn(),
  mockSetModel: vi.fn(),
  mockWhenInitialized: vi.fn(() => Promise.resolve()),
}))

vi.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'postgres://example' },
  }),
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'acme' } }),
}))
vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantState: () => ({
    createChat: mockCreateChat,
    selectChat: mockSelectChat,
    setContext: mockSetContext,
    setModel: mockSetModel,
  }),
  whenAiAssistantInitialized: () => mockWhenInitialized(),
}))

describe('useCreateChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWhenInitialized.mockImplementation(() => Promise.resolve())
  })

  it('creates and opens Explorer chats without changing the sidebar selection', async () => {
    const { result } = renderHook(() => useCreateChat())

    await act(async () => {
      await result.current.createChat({
        name: 'Investigate errors',
        initialMessage: 'What happened?',
        model: 'gpt-5.4-nano',
      })
    })

    expect(mockSetContext).toHaveBeenCalledWith({
      projectRef: 'default',
      orgSlug: 'acme',
      connectionString: 'postgres://example',
    })
    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: 'What happened?',
    })
    expect(mockSetModel).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
    expect(mockSelectChat).not.toHaveBeenCalled()

    act(() => result.current.openChat('chat-1'))

    expect(mockPush).toHaveBeenLastCalledWith('/project/default/explorer/chat/chat-1')
    expect(mockSelectChat).not.toHaveBeenCalled()
  })

  // Hydration replaces the chat map and the model wholesale, so a chat created mid-load would be
  // dropped the moment the persisted state lands
  it('waits for the assistant state to hydrate before creating the chat', async () => {
    let resolveHydration = () => {}
    mockWhenInitialized.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveHydration = resolve
        })
    )

    const { result } = renderHook(() => useCreateChat())

    let created: Promise<string | undefined> | undefined
    await act(async () => {
      created = result.current.createChat({ name: 'Investigate errors', model: 'gpt-5.4-nano' })
    })

    expect(mockCreateChat).not.toHaveBeenCalled()
    expect(mockSetModel).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()

    await act(async () => {
      resolveHydration()
      await created
    })

    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: undefined,
    })
    expect(mockSetModel).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
  })
})

describe('useLoadNotebook', () => {
  const PROJECT_REF = 'default'
  const NOTEBOOK_ID = 'local-notebook-1'

  const seedNotebook = (overrides: { status: StateNotebook['status']; content?: object }) => {
    const notebook: Notebook = {
      id: NOTEBOOK_ID,
      type: 'notebook',
      name: 'Existing notebook',
      visibility: 'project',
      favorite: false,
      owner_id: 1,
      project_id: 1,
      content: overrides.content as Notebook['content'],
    }
    notebooksState.notebooks[NOTEBOOK_ID] = {
      projectRef: PROJECT_REF,
      notebook,
      status: overrides.status,
    }
  }

  beforeEach(() => {
    mockTimeout.mockClear()
    for (const id of Object.keys(notebooksState.notebooks)) {
      delete notebooksState.notebooks[id]
    }
  })

  it('fetches the matching stub notebook and merges it into the store when nothing is cached yet', async () => {
    const [stub] = STUB_NOTEBOOKS

    const { result } = customRenderHook(() =>
      useLoadNotebook({ id: stub.id, projectRef: PROJECT_REF })
    )

    await waitFor(() =>
      expect(notebooksState.notebooks[stub.id]?.notebook.content).toEqual(stub.content)
    )
    expect(result.current.isNotFound).toBe(false)
  })

  it('does not fetch when the notebook has not been persisted yet', () => {
    seedNotebook({ status: 'new' })

    customRenderHook(() => useLoadNotebook({ id: NOTEBOOK_ID, projectRef: PROJECT_REF }))

    expect(mockTimeout).not.toHaveBeenCalled()
  })

  it('does not fetch when notebook content is already loaded', () => {
    seedNotebook({ status: 'saved', content: { schema_version: 1, cells: [] } })

    customRenderHook(() => useLoadNotebook({ id: NOTEBOOK_ID, projectRef: PROJECT_REF }))

    expect(mockTimeout).not.toHaveBeenCalled()
  })
})
